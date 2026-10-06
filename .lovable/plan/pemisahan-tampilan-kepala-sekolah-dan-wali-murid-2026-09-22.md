# Pemisahan Tampilan Kepala Sekolah dan Wali Murid

## Perubahan
- Pertahankan School Command Center lengkap khusus untuk Kepala Sekolah dan peran operasional yang berwenang.
- Buat beranda Wali Murid yang hanya menampilkan ringkasan anak terkait: profil anak, kehadiran, tugas/nilai, kesehatan, dan pengumuman.
- Batasi menu Wali Murid menjadi Beranda, Akademik Anak, Kehadiran Anak, Kesehatan Anak, Perpustakaan Anak, dan Komunikasi.
- Sesuaikan label menu untuk Wali Murid agar jelas bahwa data yang dibuka adalah milik anaknya.
- Pastikan akses langsung ke halaman di luar izin tetap ditolak.

## Pemeriksaan
- Masuk sebagai Kepala Sekolah dan pastikan seluruh menu serta Command Center tetap lengkap.
- Masuk sebagai Wali Murid dan pastikan hanya menu serta informasi anak yang tampil di desktop dan ponsel.
- Pastikan identitas akun di kanan atas sesuai dengan peran yang sedang masuk.

## Catatan Teknis
- Data masih menggunakan akun dan data contoh di sisi antarmuka sampai Lovable Cloud diaktifkan.
- Pembatasan ini adalah RBAC antarmuka; kebijakan keamanan data server akan diterapkan saat backend disambungkan.
