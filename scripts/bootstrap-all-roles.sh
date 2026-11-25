#!/bin/sh
# Bootstrap one account per school role for SDN-KBG-01.
set -e
cd "$(dirname "$0")/.."

BASE_EMAIL_DOMAIN="sdn01kebagusan.sch.id"
export SCHOOL_ID="SDN-KBG-01"
export ACCOUNT_PASSWORD="Jaklingko2026"

mk() {
  email="$1"; name="$2"; role="$3"
  teacher="$4"; student="$5"; class="$6"
  export ACCOUNT_EMAIL="$email" ACCOUNT_NAME="$name" ACCOUNT_ROLE="$role"
  export TEACHER_ID="$teacher" STUDENT_ID="$student" CLASS_ID="$class"
  echo "--- $role ($email) ---"
  npm run db:bootstrap-account 2>&1 | grep -v '^npm notice'
}

mk "kepala@$BASE_EMAIL_DOMAIN"    "Kepala SDN Kebagusan 01"        kepala_sekolah "" "" ""
mk "guru@$BASE_EMAIL_DOMAIN"      "Rina Marlina, S.Pd."            guru           "G01" "" ""
mk "walikelas@$BASE_EMAIL_DOMAIN" "Wali Kelas 1A"                  wali_kelas     "G01" "" "K1A"
mk "bendahara@$BASE_EMAIL_DOMAIN" "Bendahara SDN Kebagusan 01"     bendahara      "" "" ""
mk "pustakawan@$BASE_EMAIL_DOMAIN" "Pustakawan SDN Kebagusan 01"   pustakawan     "" "" ""
mk "sarpras@$BASE_EMAIL_DOMAIN"   "Sarpras SDN Kebagusan 01"       sarpras        "" "" ""
mk "uks@$BASE_EMAIL_DOMAIN"       "Petugas UKS SDN Kebagusan 01"   uks            "" "" ""
mk "keamanan@$BASE_EMAIL_DOMAIN"  "Keamanan SDN Kebagusan 01"      keamanan       "" "" ""
mk "walimurid@$BASE_EMAIL_DOMAIN" "Orang Tua Qonita Pratama"       walimurid      "" "K1A-S01" ""
mk "siswa@$BASE_EMAIL_DOMAIN"     "Qonita Pratama"                 siswa          "" "K1A-S01" ""
mk "auditor@$BASE_EMAIL_DOMAIN"   "Auditor SDN Kebagusan 01"       auditor        "" "" ""

echo "=== SEMUA SELESAI ==="
