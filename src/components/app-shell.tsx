import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logoDkiAsset from "@/assets/logo-dki.png.asset.json";
import logoJliAsset from "@/assets/logo-jli.png.asset.json";
import {
  BarChart3,

  BookOpen,
  Boxes,
  CalendarCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MapPinned,
  MonitorPlay,
  Search,
  Shield,
  Users,
  Database,
  Wallet,
  X,
  Upload,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { SCHOOL } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { PERAN_LABEL, inisial, type Modul } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  {
    grup: "Pusat Kendali",
    item: [
      { to: "/", modul: "beranda", label: "Command Center", icon: LayoutDashboard },
      { to: "/lokasi", modul: "lokasi", label: "Lokasi Sekolah", icon: MapPinned },
      { to: "/analitik", modul: "analitik", label: "Dashboard & Analytics", icon: BarChart3 },
      { to: "/laporan", modul: "laporan", label: "Analisis Laporan (AI)", icon: FileText },
    ],
  },

  {
    grup: "Modul Inti",
    item: [
      { to: "/akademik", modul: "akademik", label: "Akademik", icon: GraduationCap },
      { to: "/siswa-saya", modul: "akademik", label: "Siswa & Wali", icon: Users },
      { to: "/kehadiran", modul: "kehadiran", label: "Kehadiran", icon: CalendarCheck },
      { to: "/keuangan", modul: "keuangan", label: "Keuangan", icon: Wallet },
      { to: "/inventaris", modul: "inventaris", label: "Inventaris", icon: Boxes },
      { to: "/perpustakaan", modul: "perpustakaan", label: "Perpustakaan", icon: BookOpen },
      { to: "/kesehatan", modul: "kesehatan", label: "Kesehatan (UKS)", icon: HeartPulse },
      { to: "/komunikasi", modul: "komunikasi", label: "Komunikasi", icon: Megaphone },
    ],
  },
  {
    grup: "Smart School",
    item: [
      { to: "/keamanan", modul: "keamanan", label: "Smart Security", icon: Shield },
      { to: "/kelas-digital", modul: "kelas-digital", label: "Smart Classroom", icon: MonitorPlay },
    ],
  },
  {
    grup: "Administrasi",
    item: [
      { to: "/master-data", modul: "master-data", label: "Master Data & Audit", icon: Database },
      { to: "/impor-data", modul: "master-data", label: "Impor Data Excel", icon: Upload },
      { to: "/impor-modul", modul: "master-data", label: "Impor Data per Modul", icon: Upload },
    ],
  },
] as const satisfies ReadonlyArray<{
  grup: string;
  item: ReadonlyArray<{ to: string; modul: Modul; label: string; icon: typeof Shield }>;
}>;

/** Peta path → kunci modul, untuk penjagaan akses per halaman. */
export const MODUL_PATH: Record<string, Modul> = Object.fromEntries(
  NAV.flatMap((g) => g.item.map((i) => [i.to, i.modul as Modul])),
);


function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { bolehAkses: bolehLihat, sesi } = useAuth();
  const labelWali: Partial<Record<Modul, string>> = {
    beranda: "Beranda Anak",
    akademik: "Akademik Anak",
    kehadiran: "Kehadiran Anak",
    kesehatan: "Kesehatan Anak",
    perpustakaan: "Perpustakaan Anak",
    komunikasi: "Informasi Sekolah",
  };
  return (

    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="pita-merah-putih h-1 w-full shrink-0" />
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src={logoDkiAsset.url}
          alt="Logo DKI Jakarta"
          className="size-10 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Smart School Management System</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{SCHOOL.npsn} · Jakarta</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((grup) => {
          const item = grup.item.filter(
            (i) => bolehLihat(i.modul) && !(sesi?.peran === "walimurid" && i.to === "/siswa-saya"),
          );
          if (item.length === 0) return null;
          return (
            <div key={grup.grup}>
              <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                {grup.grup}
              </p>
              <ul className="space-y-0.5">
                {item.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      activeOptions={{ exact: item.to === "/" }}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{
                        className:
                          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                      }}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      {sesi?.peran === "walimurid" ? labelWali[item.modul] ?? item.label : item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>


      <div className="flex items-center justify-between gap-3 border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/70">
        <div className="min-w-0">
          <p className="font-medium text-sidebar-foreground">{SCHOOL.tahunAjaran}</p>
          <p>Semester {SCHOOL.semester}</p>
        </div>
        <img
          src={logoJliAsset.url}
          alt="Logo JLI"
          className="h-9 w-20 shrink-0 object-contain object-right"
        />
      </div>
    </div>
  );
}

const MOBILE_NAV = [
  { to: "/", modul: "beranda", label: "Beranda", icon: LayoutDashboard },
  { to: "/akademik", modul: "akademik", label: "Akademik", icon: GraduationCap },
  { to: "/kehadiran", modul: "kehadiran", label: "Hadir", icon: CalendarCheck },
  { to: "/siswa-saya", modul: "akademik", label: "Siswa", icon: Users },
] as const satisfies ReadonlyArray<{ to: string; modul: Modul; label: string; icon: typeof Shield }>;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { sesi, siapMemuat, keluar, bolehAkses } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const modul = MODUL_PATH[pathname];
  const ruteGuru = pathname === "/siswa-saya" || pathname.startsWith("/tugas/") || pathname.startsWith("/ujian/");
  const labelMobileWali: Partial<Record<Modul, string>> = {
    beranda: "Anak",
    akademik: "Akademik",
    kehadiran: "Hadir",
  };

  useEffect(() => {
    if (siapMemuat && !sesi) navigate({ to: "/auth", replace: true });
  }, [siapMemuat, sesi, navigate]);

  if (!siapMemuat || !sesi) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Memeriksa sesi…</p>
      </div>
    );
  }

  if ((modul && !bolehAkses(modul)) || (sesi.peran === "walimurid" && ruteGuru)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <Shield className="mx-auto size-10 text-destructive" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-foreground">Akses ditolak</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Peran <strong>{PERAN_LABEL[sesi.peran]}</strong> tidak memiliki izin untuk membuka modul
            ini. Hubungi Operator Sekolah bila Anda membutuhkan akses.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => navigate({ to: "/" })}>Kembali ke beranda</Button>
            <Button variant="outline" onClick={keluar}>
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarContent />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="pita-merah-putih h-0.5 w-full" />
          <div className="flex w-full items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="size-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{SCHOOL.nama}</p>
              <p className="truncate text-xs text-muted-foreground">{SCHOOL.alamatSingkat}</p>
            </div>

            <div className="relative hidden w-52 shrink md:block xl:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari siswa, aset, transaksi…" className="pl-9" />
            </div>


            <div className="flex shrink-0 items-center gap-1.5">
              <img
                src={logoJliAsset.url}
                alt="Logo JLI"
                className="h-8 w-12 shrink-0 object-contain object-right lg:hidden"
              />
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-border py-1 pl-1.5 pr-1 sm:py-1.5 sm:pl-2 sm:pr-1.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {inisial(sesi.nama)}
              </span>
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold leading-tight">{sesi.nama}</p>
                <p className="text-[0.7rem] leading-tight text-muted-foreground">
                  {PERAN_LABEL[sesi.peran]}
                  {sesi.konteks ? ` · ${sesi.konteks}` : ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Keluar"
                title="Keluar"
                onClick={() => {
                  keluar();
                  navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut className="size-4" />
              </Button>
              </div>
            </div>

          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:pb-6">{children}</main>

        <footer className="hidden border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:block lg:px-8">
          JLI@2026 · Waktu tampil zona Asia/Jakarta (UTC+7) · Audit trail aktif untuk seluruh
          transaksi kritikal.
        </footer>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgb(0_0_0/0.08)] backdrop-blur lg:hidden" aria-label="Navigasi utama ponsel">
        {MOBILE_NAV.filter((item) => bolehAkses(item.modul) && !(sesi.peran === "walimurid" && item.to === "/siswa-saya")).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.65rem] font-medium text-muted-foreground"
            activeProps={{ className: "bg-accent text-primary" }}
          >
            <item.icon className="size-5 shrink-0" aria-hidden />
            <span className="truncate">
              {sesi.peran === "walimurid" ? labelMobileWali[item.modul] ?? item.label : item.label}
            </span>
          </Link>
        ))}
        <Button
          variant="ghost"
          className="flex min-h-12 h-auto min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.65rem] font-medium text-muted-foreground"
          onClick={() => setOpen(true)}
          aria-label="Buka semua menu"
        >
          <Menu className="size-5 shrink-0" aria-hidden />
          <span>Menu</span>
        </Button>
      </nav>
    </div>
  );
}

export function PageHeader({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-4 sm:mb-6 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{judul}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{deskripsi}</p>
      </div>
      {aksi ? <div className="flex shrink-0 flex-wrap justify-end gap-2">{aksi}</div> : null}
    </div>
  );
}

const NADA: Record<string, string> = {
  netral: "bg-secondary text-secondary-foreground",
  baik: "bg-success/12 text-success",
  peringatan: "bg-warning/18 text-warning-foreground",
  bahaya: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
};

export function StatusPill({
  children,
  nada = "netral",
}: {
  children: ReactNode;
  nada?: keyof typeof NADA;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        NADA[nada],
      )}
    >
      {children}
    </span>
  );
}

export function nadaStatus(status: string): keyof typeof NADA {
  const s = status.toLowerCase();
  if (["hadir", "disetujui", "selesai", "baik", "tersedia", "online", "terkirim", "dikembalikan", "aktif", "normal"].some((k) => s.includes(k)))
    return "baik";
  if (["menunggu", "terlambat", "izin", "berjalan", "perbaikan", "dijadwalkan", "sedang", "perlu", "rusak ringan", "draft", "terjadwal"].some((k) => s.includes(k)))
    return "peringatan";
  if (["alfa", "ditolak", "gagal", "offline", "terbuka", "tinggi", "rusak berat", "rujukan"].some((k) => s.includes(k)))
    return "bahaya";
  return "netral";
}
