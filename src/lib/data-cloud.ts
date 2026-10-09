import { useEffect, useState } from "react";
import { hydrateSchoolData, subscribeSchoolData, schoolDataVersion } from "@/lib/school-data";

export { jumlahDariCloud } from "@/lib/school-data";
export const kelasKeId = (value: string) => `K${value.trim().toUpperCase()}`;
export const siswaKeId = (_kelas: string, nisn: string) => `DB-${nisn}`;
export const muatUlangDataCloud = hydrateSchoolData;

export function useDataCloud() {
  const [version, setVersion] = useState(schoolDataVersion);
  useEffect(() => subscribeSchoolData(setVersion), []);
  return version;
}
