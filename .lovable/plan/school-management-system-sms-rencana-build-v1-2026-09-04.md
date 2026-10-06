# School Management System (SMS) — Rencana Build v1

Aplikasi web sesuai Master BRD: School Command Center sebagai pusat, 10 modul (versi dasar), dengan Akademik & Kehadiran dibangun paling lengkap (Tahap 1 BRD). Backend penuh dengan Lovable Cloud (database + login multi-role).

## Tema Visual
Merah–putih (identitas nasional/sekolah negeri): merah sebagai warna aksi/aksen, putih sebagai kanvas, abu netral untuk teks & garis. Tampilan formal-institusional, padat data, sidebar kiri + topbar. Bahasa antarmuka: Bahasa Indonesia. Waktu ditampilkan Asia/Jakarta.

## Autentikasi & Peran
- Login email/password, halaman `/auth`, semua halaman aplikasi di balik gate.
- Peran disimpan di tabel `user_roles` terpisah (bukan di profil) + fungsi `has_role` untuk kebijakan akses.
- Peran: dinas, kepala_sekolah, guru, siswa, orang_tua, operator, bendahara, pustakawan, uks, security, it_admin, auditor.
- Menu & aksi menyesuaikan peran; data dibatasi per `school_id`.

## Halaman

Command Center (beranda setelah login)
- KPI: kehadiran hari ini, jumlah siswa/guru, tagihan/realisasi anggaran, buku dipinjam, insiden keamanan terbuka, perangkat IoT online.
- Grafik tren kehadiran mingguan, distribusi nilai, ringkasan keuangan.
- Panel notifikasi & insiden terbaru.

Modul mendalam
1. Akademik — tahun ajaran, kelas, mata pelajaran, jadwal, tugas, ujian, input nilai, e-rapor per siswa.
2. Kehadiran — presensi harian per kelas (manual + input kode QR/kartu), izin/sakit, rekap & rekap per siswa, notifikasi ketidakhadiran.

Modul versi dasar (CRUD + ringkasan)
3. Keuangan — anggaran (BOS), transaksi pemasukan/pengeluaran, status approval, laporan.
4. Inventaris — daftar aset berkode, peminjaman/pengembalian, jadwal maintenance.
5. Perpustakaan — katalog buku, sirkulasi pinjam/kembali, daftar terlambat.
6. Kesehatan (UKS) — kunjungan, antropometri (TB/BB), screening, rujukan.
7. Komunikasi — pengumuman sekolah, pesan ke kelas/wali, riwayat notifikasi.
8. Smart Security — daftar tamu (visitor log), insiden, panic button/alert, status gerbang & CCTV.
9. Smart Classroom — materi digital, kuis, monitoring perangkat kelas.
10. Master Data & Audit — sekolah, siswa, guru, orang tua (tautan anak), pengguna & peran, log audit.

## Data & Aturan
- Setiap tabel: `id` UUID, `school_id`, kolom audit `created_by/created_at/updated_by/updated_at`.
- Status memakai enum eksplisit (mis. kehadiran: hadir/izin/sakit/alfa/terlambat).
- RLS aktif di semua tabel + GRANT sesuai peran; auditor read-only.
- Data contoh (seed) untuk 1 sekolah: kelas, siswa, guru, jadwal, presensi, buku, aset, transaksi — agar dashboard langsung terisi.

## Catatan Teknis
- TanStack Start + TanStack Query; server function untuk semua operasi data.
- Tabel utama: schools, profiles, user_roles, students, teachers, parents_students, classes, subjects, schedules, assignments, exams, grades, attendance, budgets, transactions, assets, asset_loans, books, book_loans, health_records, announcements, messages, visitors, incidents, devices, materials, quizzes, audit_logs.
- Setiap halaman punya metadata head sendiri (title/description).

## Di Luar Scope v1
Mobile app native, integrasi nyata WhatsApp Gateway / CCTV AI / RFID hardware, SSO/OIDC & MFA, data warehouse. Modul-modul terkait disiapkan sebagai UI + data dalam aplikasi sehingga integrasi bisa ditambahkan kemudian.

## Urutan Pengerjaan
1. Aktifkan Lovable Cloud, buat skema + RLS + seed.
2. Auth, peran, layout (sidebar/topbar) & tema merah-putih.
3. Command Center.
4. Akademik & Kehadiran lengkap.
5. Delapan modul dasar + master data/audit.
