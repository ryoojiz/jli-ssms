import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginAccount, logoutAccount, readSession, selectSchool } from "@/lib/auth.functions";
import { bolehAkses, bolehUbah, type Modul, type Sesi } from "@/lib/rbac";
import { hydrateSchoolData } from "@/lib/school-data";
import { resetPrioritySnapshot } from "@/lib/priority-store";
import { resetWorkflowSnapshot } from "@/lib/workflow-store";

type AuthValue = {
  sesi: Sesi | null | undefined;
  siapMemuat: boolean;
  galatKoneksi: string | null;
  masuk: (email: string, kataSandi: string) => Promise<{ ok: boolean; pesan?: string }>;
  keluar: () => Promise<void>;
  pilihSekolah: (schoolId: string) => Promise<void>;
  bolehAkses: (modul: Modul) => boolean;
  bolehUbah: (modul: Modul) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<Sesi | null | undefined>(undefined);
  const [galatKoneksi, setGalatKoneksi] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    readSession()
      .then(async (value) => {
        if (value) await hydrateSchoolData();
        if (alive) setSesi(value);
      })
      .catch((error) => {
        if (alive) {
          console.error("Koneksi server sekolah gagal.", error);
          setGalatKoneksi(
            "Tidak dapat terhubung ke database MySQL. Periksa konfigurasi dan layanan server.",
          );
          setSesi(null);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const masuk = useCallback<AuthValue["masuk"]>(async (email, kataSandi) => {
    try {
      resetPrioritySnapshot();
      resetWorkflowSnapshot();
      const next = await loginAccount({ data: { email, password: kataSandi } });
      await hydrateSchoolData();
      setSesi(next);
      setGalatKoneksi(null);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal masuk ke server.";
      return {
        ok: false,
        pesan: /connect|database|DATABASE_URL|ECONNREFUSED|ETIMEDOUT/i.test(message)
          ? "Tidak dapat terhubung ke database MySQL. Periksa konfigurasi dan layanan server."
          : message,
      };
    }
  }, []);

  const keluar = useCallback(async () => {
    await logoutAccount();
    resetPrioritySnapshot();
    resetWorkflowSnapshot();
    setSesi(null);
  }, []);

  const pilihSekolah = useCallback(async (schoolId: string) => {
    await selectSchool({ data: { schoolId } });
    resetPrioritySnapshot();
    resetWorkflowSnapshot();
    setSesi(undefined);
    window.location.reload();
  }, []);

  const nilai = useMemo<AuthValue>(
    () => ({
      sesi,
      siapMemuat: sesi !== undefined,
      galatKoneksi,
      masuk,
      keluar,
      pilihSekolah,
      bolehAkses: (modul) => (sesi ? bolehAkses(sesi.peran, modul) : false),
      bolehUbah: (modul) => (sesi ? bolehUbah(sesi.peran, modul) : false),
    }),
    [sesi, masuk, keluar, pilihSekolah, galatKoneksi],
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
