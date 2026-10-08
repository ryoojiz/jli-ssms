import { useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  addStockItem,
  handOverStock,
  receiveStock,
  requestStock,
  reviewStockCount,
  reviewStockRequest,
  stockBalance,
  submitStockCount,
  usePriorityDemo,
} from "@/lib/priority-demo";

const run = (action: () => void, message: string) => {
  try {
    action();
    toast.success(message);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Transaksi gagal.");
  }
};

export function WarehouseDemo() {
  const { sesi } = useAuth();
  const state = usePriorityDemo();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [observed, setObserved] = useState("");
  const [reason, setReason] = useState("");
  const selected = itemId || state.items[0]?.id || "";
  const itemName = (id: string) =>
    state.items.find((i) => i.id === id)?.name ?? "Barang tidak ditemukan";
  const visibleRequests = state.requests.filter(
    (r) =>
      ["operator", "sarpras", "kepala_sekolah", "auditor"].includes(sesi?.peran ?? "") ||
      r.createdBy === sesi?.email.toLowerCase(),
  );
  if (!sesi) return null;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-semibold">Gudang barang habis pakai · demo satu browser</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Terpisah dari aset bernomor unik. Saldo berasal dari barang masuk, penyerahan, dan opname
          yang disetujui. Data Cloud tidak diubah.
        </p>
        {sesi.peran === "operator" && (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="stock-name">Nama barang</Label>
              <Input
                id="stock-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mis. kertas A4"
              />
            </div>
            <div>
              <Label htmlFor="stock-unit">Satuan</Label>
              <Input
                id="stock-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Rim"
              />
            </div>
            <div>
              <Label htmlFor="stock-location">Lokasi</Label>
              <Input
                id="stock-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Gudang utama"
              />
            </div>
            <Button
              className="self-end"
              onClick={() =>
                run(() => {
                  addStockItem(sesi, name, unit, location);
                  setName("");
                  setUnit("");
                  setLocation("");
                }, "Barang ditambahkan.")
              }
            >
              Tambah barang
            </Button>
          </div>
        )}
        {state.items.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Belum ada barang. Operator dapat membuat katalog barang habis pakai di atas.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[35rem] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Barang</th>
                  <th className="p-2">Lokasi</th>
                  <th className="p-2">Saldo</th>
                  <th className="p-2">Satuan</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 font-medium">{item.name}</td>
                    <td className="p-2">{item.location}</td>
                    <td className="p-2">{stockBalance(state, item.id)}</td>
                    <td className="p-2">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {state.items.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Transaksi harian</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="stock-item">Barang</Label>
              <select
                id="stock-item"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={selected}
                onChange={(e) => setItemId(e.target.value)}
              >
                {state.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} · {i.location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="stock-qty">Jumlah</Label>
              <Input
                id="stock-qty"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="stock-note">Keperluan / keterangan</Label>
              <Input id="stock-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {!["siswa", "walimurid", "auditor", "kepala_sekolah"].includes(sesi.peran) && (
                <Button
                  onClick={() =>
                    run(() => {
                      requestStock(sesi, selected, Number(qty), note);
                      setQty("");
                      setNote("");
                    }, "Permintaan dikirim ke sarpras.")
                  }
                >
                  Minta barang
                </Button>
              )}
              {["operator", "sarpras"].includes(sesi.peran) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    run(() => {
                      receiveStock(sesi, selected, Number(qty), note);
                      setQty("");
                      setNote("");
                    }, "Barang masuk dicatat.")
                  }
                >
                  Catat masuk
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold">Permintaan dan penyerahan</h2>
        {visibleRequests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada permintaan barang.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {visibleRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <b>{itemName(request.itemId)}</b> · {request.quantity}{" "}
                  {state.items.find((i) => i.id === request.itemId)?.unit}
                  <p className="text-muted-foreground">
                    {request.note} · {request.createdBy} · {request.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {sesi.peran === "sarpras" && request.status === "Menunggu" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          run(
                            () => reviewStockRequest(sesi, request.id, true),
                            "Permintaan disetujui; stok belum berkurang.",
                          )
                        }
                      >
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          run(
                            () => reviewStockRequest(sesi, request.id, false),
                            "Permintaan ditolak.",
                          )
                        }
                      >
                        Tolak
                      </Button>
                    </>
                  )}
                  {sesi.peran === "sarpras" && request.status === "Disetujui" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        run(
                          () => handOverStock(sesi, request.id),
                          "Barang diserahkan; stok berkurang.",
                        )
                      }
                    >
                      Serahkan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {["sarpras", "operator", "kepala_sekolah", "auditor"].includes(sesi.peran) && (
        <Card className="p-5">
          <h2 className="font-semibold">Stock opname</h2>
          {sesi.peran === "sarpras" && state.items.length > 0 && (
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <Label htmlFor="count-item">Barang</Label>
                <select
                  id="count-item"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={selected}
                  onChange={(e) => setItemId(e.target.value)}
                >
                  {state.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="count-qty">Jumlah fisik</Label>
                <Input
                  id="count-qty"
                  type="number"
                  min="0"
                  value={observed}
                  onChange={(e) => setObserved(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="count-reason">Alasan selisih / verifikasi</Label>
                <Input
                  id="count-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                className="self-end"
                onClick={() =>
                  run(() => {
                    if (observed.trim() === "") throw new Error("Isi jumlah fisik hasil opname.");
                    submitStockCount(sesi, selected, Number(observed), reason);
                    setObserved("");
                    setReason("");
                  }, "Opname menunggu persetujuan operator.")
                }
              >
                Ajukan opname
              </Button>
            </div>
          )}
          {state.counts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada hasil opname.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {state.counts.map((count) => (
                <div
                  key={count.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <div>
                    <b>{itemName(count.itemId)}</b> · sistem {count.expected}, fisik{" "}
                    {count.observed}
                    <p className="text-muted-foreground">
                      {count.reason} · {count.status}
                    </p>
                  </div>
                  {sesi.peran === "operator" && count.status === "Menunggu" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          run(
                            () => reviewStockCount(sesi, count.id, true),
                            "Penyesuaian disetujui.",
                          )
                        }
                      >
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          run(() => reviewStockCount(sesi, count.id, false), "Opname ditolak.")
                        }
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-semibold">Riwayat pergerakan stok</h2>
        {state.movements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada pergerakan stok.</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            {state.movements.map((movement) => (
              <p key={movement.id} className="border-b pb-2">
                {movement.createdAt.slice(0, 16).replace("T", " ")} · {itemName(movement.itemId)} ·{" "}
                {movement.kind} {movement.delta > 0 ? "+" : ""}
                {movement.delta} · {movement.createdBy} · {movement.note}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
