import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { AKUN_DEMO, bolehAkses, bolehUbah, type Modul, type Sesi } from "@/lib/rbac";

const KUNCI = "sms.sesi";

type AuthValue = {
  /** undefined = belum selesai membaca penyimpanan (hidrasi) */
  sesi: Sesi | null | undefined;
  siapMemuat: boolean;
  masuk: (email: string, kataSandi: string) => Promise<{ ok: boolean; pesan?: string }>;
  masukSebagai: (sesi: Sesi) => void;
  keluar: () => void;
  bolehAkses: (modul: Modul) => boolean;
  bolehUbah: (modul: Modul) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<Sesi | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KUNCI);
      setSesi(raw ? (JSON.parse(raw) as Sesi) : null);
    } catch {
      setSesi(null);
    }
  }, []);

  const simpan = useCallback((baru: Sesi | null) => {
    setSesi(baru);
    try {
      if (baru) window.localStorage.setItem(KUNCI, JSON.stringify(baru));
      else window.localStorage.removeItem(KUNCI);
    } catch {
      /* abaikan */
    }
  }, []);

  const masuk = useCallback<AuthValue["masuk"]>(
    async (email, kataSandi) => {
      // Placeholder autentikasi: nanti diganti supabase.auth.signInWithPassword.
      await new Promise((r) => setTimeout(r, 350));
      const akun = AKUN_DEMO.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (!akun) return { ok: false, pesan: "Email tidak terdaftar pada akun demo." };
      if (akun.kataSandi !== kataSandi) return { ok: false, pesan: "Kata sandi salah." };
      const { kataSandi: _abaikan, ...profil } = akun;
      simpan(profil);
      return { ok: true };
    },
    [simpan],
  );

  const nilai = useMemo<AuthValue>(
    () => ({
      sesi,
      siapMemuat: sesi !== undefined,
      masuk,
      masukSebagai: (baru) => simpan(baru),
      keluar: () => simpan(null),
      bolehAkses: (modul) => (sesi ? bolehAkses(sesi.peran, modul) : false),
      bolehUbah: (modul) => (sesi ? bolehUbah(sesi.peran, modul) : false),
    }),
    [sesi, masuk, simpan],
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
