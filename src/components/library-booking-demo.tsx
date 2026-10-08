import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { KELAS } from "@/lib/demo-data";
import {
  canBookClass,
  cancelBooking,
  completeBooking,
  createBooking,
  reviewBooking,
  setRoomCapacity,
  usePriorityDemo,
} from "@/lib/priority-demo";

const run = (action: () => void, message: string) => {
  try {
    action();
    toast.success(message);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Booking gagal.");
  }
};

export function LibraryBookingDemo() {
  const { sesi } = useAuth();
  const state = usePriorityDemo();
  const [classId, setClassId] = useState("K5A");
  const [day, setDay] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [expected, setExpected] = useState("");
  const [capacity, setCapacity] = useState("");
  const [actuals, setActuals] = useState<Record<string, string>>({});
  if (!sesi) return null;
  const classes = KELAS.filter((k) => canBookClass(sesi, k.id));
  const bookings = state.bookings.filter(
    (b) =>
      ["pustakawan", "operator", "kepala_sekolah", "auditor"].includes(sesi.peran) ||
      b.createdBy === sesi.email.toLowerCase(),
  );
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-semibold">Booking Ruang Perpustakaan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Satu ruang untuk kunjungan kelas/kelompok. Slot menunggu konfirmasi pustakawan; kunjungan
          aktual dicatat setelah kegiatan. Tidak ada pesan otomatis ke luar aplikasi.
        </p>
        <p className="mt-2 text-sm">
          Kapasitas saat ini: <b>{state.roomCapacity} orang</b>
        </p>
        {sesi.peran === "pustakawan" && (
          <div className="mt-3 flex max-w-sm gap-2">
            <Input
              aria-label="Kapasitas baru"
              type="number"
              min="1"
              max="200"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Kapasitas baru"
            />
            <Button
              variant="outline"
              onClick={() =>
                run(() => {
                  setRoomCapacity(sesi, Number(capacity));
                  setCapacity("");
                }, "Kapasitas ruang diperbarui.")
              }
            >
              Simpan
            </Button>
          </div>
        )}
      </Card>
      {classes.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Ajukan kunjungan</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="visit-class">Kelas</Label>
              <select
                id="visit-class"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={classes.some((k) => k.id === classId) ? classId : classes[0]?.id}
                onChange={(e) => setClassId(e.target.value)}
              >
                {classes.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="visit-date">Tanggal</Label>
              <Input
                id="visit-date"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visit-count">Perkiraan peserta</Label>
              <Input
                id="visit-count"
                type="number"
                min="1"
                max={state.roomCapacity}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visit-start">Mulai</Label>
              <Input
                id="visit-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visit-end">Selesai</Label>
              <Input
                id="visit-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visit-purpose">Tujuan</Label>
              <Input
                id="visit-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Mis. literasi kelas"
              />
            </div>
          </div>
          <Button
            className="mt-3"
            onClick={() =>
              run(() => {
                createBooking(
                  sesi,
                  classes.some((k) => k.id === classId) ? classId : classes[0]!.id,
                  day,
                  start,
                  end,
                  purpose,
                  Number(expected),
                );
                setPurpose("");
                setExpected("");
              }, "Permintaan booking tersimpan.")
            }
          >
            Ajukan booking
          </Button>
        </Card>
      )}
      <Card className="p-5">
        <h2 className="font-semibold">Jadwal dan realisasi kunjungan</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada booking yang terlihat untuk akun ini.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b>
                      {b.date} · {b.start}–{b.end} · {KELAS.find((k) => k.id === b.classId)?.nama}
                    </b>
                    <p>
                      {b.purpose} · rencana {b.expected} orang
                      {b.actual !== undefined ? ` · hadir ${b.actual} orang` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {b.status} · diajukan {b.createdBy}
                      {b.reviewedBy ? ` · ditinjau ${b.reviewedBy}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sesi.peran === "pustakawan" && b.status === "Menunggu" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            run(() => reviewBooking(sesi, b.id, true), "Booking dikonfirmasi.")
                          }
                        >
                          Konfirmasi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(() => reviewBooking(sesi, b.id, false), "Booking ditolak.")
                          }
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                    {["Menunggu", "Dikonfirmasi"].includes(b.status) &&
                      (sesi.peran === "pustakawan" || b.createdBy === sesi.email.toLowerCase()) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(() => cancelBooking(sesi, b.id), "Booking dibatalkan.")
                          }
                        >
                          Batalkan
                        </Button>
                      )}
                  </div>
                </div>
                {sesi.peran === "pustakawan" && b.status === "Dikonfirmasi" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Input
                      className="w-36"
                      aria-label={`Jumlah hadir ${b.classId} ${b.date}`}
                      type="number"
                      min="1"
                      value={actuals[b.id] ?? ""}
                      onChange={(e) => setActuals((v) => ({ ...v, [b.id]: e.target.value }))}
                      placeholder="Jumlah hadir"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        run(
                          () => completeBooking(sesi, b.id, Number(actuals[b.id])),
                          "Kunjungan tercatat.",
                        )
                      }
                    >
                      Catat hadir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        run(() => completeBooking(sesi, b.id, null), "Tidak hadir dicatat.")
                      }
                    >
                      Tidak hadir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
