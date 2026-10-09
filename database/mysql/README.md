# JLI SSMS — MySQL 8.4

Migrasi MySQL berada di `database/mysql/migrations`. Berkas PostgreSQL lama di `drizzle/migrations` tidak dijalankan oleh perintah di bawah. Koneksi hanya digunakan server Node; jangan membuat variabel `VITE_DATABASE_URL` atau menghubungkan browser langsung ke MySQL.

## Persiapan

1. Sediakan sendiri instance MySQL 8.4 dan database kosong, misalnya `jli_ssms`. Pekerjaan ini tidak membuat atau menjalankan server MySQL.
2. Buat pengguna database dengan izin DDL/DML untuk migrasi dan seed. Untuk operasi aplikasi sehari-hari, gunakan pengguna terpisah dengan izin DML saja bila lingkungan mendukungnya.
3. Salin `.env.example` ke `.env` dan isi `DATABASE_URL` di lingkungan server. Skrip dan server Node memuat `.env` otomatis; variabel lingkungan yang sudah ada tetap dipakai. Jangan commit kata sandi.
4. Jalankan `npm install`, `npm run db:migrate`, lalu `npm run db:seed`. Seed memakai upsert tanpa perubahan pada baris yang sudah ada: dapat dijalankan lagi tanpa duplikasi dan tidak menimpa perubahan operasional, sementara kesalahan relasi tetap dilaporkan. Hanya SDN Kebagusan 01 Pagi yang menerima data operasional. Manggarai 09 dan sekolah lain dalam seed hanya entri direktori.
5. Buat setidaknya satu akun operator memakai perintah bootstrap berikut. Tidak ada akun atau kata sandi bawaan.

```powershell
$env:DATABASE_URL = 'mysql://ssms_user:password@127.0.0.1:3306/jli_ssms'
$env:SCHOOL_ID = 'SDN-KBG-01'
$env:ACCOUNT_EMAIL = 'operator@example.sch.id'
$env:ACCOUNT_NAME = 'Operator Sekolah'
$env:ACCOUNT_ROLE = 'operator'
$env:ACCOUNT_PASSWORD = 'ganti-dengan-sandi-panjang-unik'
npm run db:bootstrap-account
```

Untuk akun yang sama di sekolah lain, jalankan lagi dengan `SCHOOL_ID` yang lain. Sandi lama dipertahankan; set `ACCOUNT_ROTATE_PASSWORD=yes` hanya ketika hendak mengganti sandi dan membatalkan semua sesi aktif akun itu. Untuk wali kelas isi juga `TEACHER_ID` dan `CLASS_ID`; untuk guru isi `TEACHER_ID`; untuk wali murid atau siswa isi `STUDENT_ID`. Bootstrap memvalidasi ID terhadap sekolah terkait. Akun wali murid mendapat tautan ke siswa tersebut.

Sekolah baru tanpa data operasional dapat didaftarkan dengan `SCHOOL_ID`, `SCHOOL_NAME`, dan opsional `SCHOOL_NPSN`, kemudian `npm run db:register-school`. Setelah itu impor data sekolah dan bootstrap akun melalui sekolah tersebut; modul tidak memerlukan cabang kode per sekolah.

## Menjalankan aplikasi

`npm run dev` untuk pengembangan. Untuk server Node, jalankan `npm run build` lalu `npm start` dengan `DATABASE_URL` dan `PORT` yang sesuai. Build dan pemeriksaan tipe tidak memerlukan MySQL. Saat runtime tanpa koneksi, halaman masuk menampilkan galat koneksi dan tidak memakai data contoh sebagai fallback.

## Batas migrasi dan verifikasi yang masih diperlukan

- Data yang sudah tersimpan di browser atau Lovable Cloud tidak diimpor dan tidak dihapus. Dataset bawaan direproduksi oleh seed MySQL.
- Impor guru/kelas/siswa/kehadiran di-upsert ke tabel operasional. Impor Excel per modul dicatat di `import_batches`/`import_rows` dan dipetakan ke tabel modul; sheet integrasi eksternal memakai `integration_records` karena kontrak sistem sumber belum ditetapkan. Data impor harus ditinjau sebelum dipakai sebagai catatan resmi.
- Untuk sekolah baru, impor guru/kelas/siswa terlebih dahulu, kemudian jadwal/tugas. NIP guru, kelas, dan mapel pada sheet jadwal/tugas membentuk penugasan guru–kelas–mapel yang dipakai pemeriksaan akses nilai dan booking.
- Alur gudang, booking, nilai, kehadiran, izin, pengumuman, dan notifikasi memakai transaksi MySQL dengan pemeriksaan sesi/peran/sekolah. Uji integrasi nyata perlu dilakukan setelah MySQL tersedia: jalankan seed dua kali; coba dua sekolah dengan akun multi-keanggotaan; uji penolakan lintas sekolah; uji dua konfirmasi booking bersamaan, dua penyerahan barang saat stok terbatas, replay dengan kunci sama, koreksi/publikasi nilai, dan notifikasi unik. Jangan menganggap migrasi SQL atau transaksi telah teruji terhadap MySQL sampai uji ini dijalankan.
- Beberapa laporan contoh dan layar turunan akademik masih memakai bentuk data lama yang diisi ulang dari MySQL. Tinjau ulang definisi KPI dan cakupan privasi per layar sebelum peluncuran produksi.
