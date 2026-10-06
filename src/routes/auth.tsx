import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import logoDkiAsset from "@/assets/logo-dki.png.asset.json";
import logoJliAsset from "@/assets/logo-jli.png.asset.json";
import welcomeDigitalSchool from "@/assets/welcome-digital-school.jpg";
import { SCHOOL } from "@/lib/demo-data";
import { AKUN_DEMO, PERAN_LABEL } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — SMS Sekolah Negeri Jakarta" },
      {
        name: "description",
        content:
          "Halaman masuk Smart School Management System dengan akses berbasis peran: kepala sekolah, operator, guru, bendahara, wali murid, hingga auditor.",
      },
      { property: "og:title", content: "Masuk — SMS Sekolah Negeri Jakarta" },
      {
        property: "og:description",
        content: "Autentikasi dan akses berbasis peran (RBAC) untuk seluruh modul sekolah.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HalamanAuth,
});

function HalamanAuth() {
  const { sesi, masuk } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("operator@sdn01.sch.id");
  const [kataSandi, setKataSandi] = useState("demo1234");
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (sesi) navigate({ to: "/", replace: true });
  }, [sesi, navigate]);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat(null);
    setProses(true);
    const hasil = await masuk(email, kataSandi);
    setProses(false);
    if (!hasil.ok) setGalat(hasil.pesan ?? "Gagal masuk.");
    else navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_minmax(0,32rem)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
        <img
          src={welcomeDigitalSchool}
          alt="Siswa SD belajar menggunakan teknologi digital bersama guru"
          width={1536}
          height={1024}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-sidebar/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/85 via-sidebar/50 to-sidebar/10" />

        <div className="pita-merah-putih absolute inset-x-0 top-0 h-1.5" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-10">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src={logoDkiAsset.url}
                alt="Logo Pemerintah DKI Jakarta"
                className="h-14 w-14 shrink-0 object-contain"
              />
              <p className="max-w-md font-semibold uppercase tracking-wide">
                SISTEM MANAJEMEN SEKOLAH
              </p>
            </div>
          </div>

          <div className="max-w-xl pb-4">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Selamat Datang</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-sidebar-foreground/80 sm:text-base">
              Di sistem digitalisasi manajemen sekolah perpadu bidang akademik, kehadiran, layanan
              sekolah dan komunikasi seluruh warga sekolah di DKI Jakarta
            </p>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <img
                src={logoJliAsset.url}
                alt="Logo JLI"
                className="h-11 w-32 shrink-0 object-contain"
              />
              <p className="max-w-sm text-xs font-medium leading-5 text-sidebar-foreground/85">
                Satu Platform, Satu Data dan Satu Ekosistem Jakarta Lebih baik untuk Indonesia
              </p>
            </div>
            <p className="mt-2 text-xs text-sidebar-foreground/70">
              Tahun Ajaran {SCHOOL.tahunAjaran} · Semester {SCHOOL.semester} · Zona Asia/Jakarta
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src={logoDkiAsset.url}
              alt="Logo Pemerintah DKI Jakarta"
              className="h-12 w-12 shrink-0 object-contain"
            />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">SISTEM MANAJEMEN SEKOLAH</p>
                <p className="text-xs text-muted-foreground">{SCHOOL.nama}</p>
              </div>
            <img
              src={logoJliAsset.url}
              alt="Logo JLI"
              className="ml-auto h-9 w-20 shrink-0 object-contain object-right"
            />
          </div>

          <h2 className="text-2xl font-bold text-foreground">Masuk ke akun sekolah</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan email dinas Anda. Autentikasi asli akan aktif setelah backend Cloud tersambung.
          </p>

          <form onSubmit={kirim} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sandi">Kata sandi</Label>
              <Input
                id="sandi"
                type="password"
                autoComplete="current-password"
                required
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
              />
            </div>

            {galat ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {galat}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={proses}>
              <LogIn className="size-4" />
              {proses ? "Memproses…" : "Masuk"}
            </Button>
          </form>

          <Card className="mt-6 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="size-4 text-primary" />
              Coba sebagai peran lain
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kata sandi semua akun demo: <code className="font-semibold">demo1234</code>
            </p>
            <div className="mt-3 grid max-h-60 gap-1 overflow-y-auto">
              {AKUN_DEMO.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setKataSandi(a.kataSandi);
                    setGalat(null);
                  }}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                >
                  <span>
                    <span className="block font-semibold text-foreground">{PERAN_LABEL[a.peran]}</span>
                    <span className="text-muted-foreground">{a.email}</span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] text-muted-foreground">pilih</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
