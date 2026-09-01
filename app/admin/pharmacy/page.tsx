"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

type Branch = { _id: string; name: string };
type Batch = { batchNo: string; expiredDate: string; quantity: number };
type MedicineRow = {
  _id: string;
  name: string;
  unit: string;
  stock: { current: number; minimum: number };
  pricing: { sellPrice: number };
  branchId?: { _id: string; name: string };
  batches?: Batch[];
};

const emptyForm = { branchId: "", name: "", unit: "tablet", current: 0, minimum: 10, sellPrice: 0, buyPrice: 0 };
const emptyBatch = { batchNo: "", expiredDate: "", quantity: 1 };

function nearestExpiry(batches?: Batch[]) {
  if (!batches || batches.length === 0) return null;
  const sorted = [...batches].sort((a, b) => new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime());
  return sorted[0];
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showTransfer, setShowTransfer] = useState<MedicineRow | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferQty, setTransferQty] = useState(1);

  const [predicting, setPredicting] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ id: string; text: string } | null>(null);

  const [showBatch, setShowBatch] = useState<MedicineRow | null>(null);
  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [batchError, setBatchError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicines");
      const json = await res.json();
      if (json.success) setMedicines(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
       
      .then((j) => j.success && setBranches(j.data));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: form.branchId,
          name: form.name,
          unit: form.unit,
          stock: { current: Number(form.current), minimum: Number(form.minimum) },
          pricing: { sellPrice: Number(form.sellPrice), buyPrice: Number(form.buyPrice) },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan obat");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function doTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!showTransfer) return;
    const res = await fetch("/api/medicines/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineId: showTransfer._id, toBranchId: transferTo, quantity: transferQty }),
    });
    const json = await res.json();
    if (json.success) {
      setShowTransfer(null);
      load();
    } else {
      alert(json.error?.message);
    }
  }

  async function addBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!showBatch) return;
    setBatchError("");
    const res = await fetch(`/api/medicines/${showBatch._id}/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...batchForm, quantity: Number(batchForm.quantity) }),
    });
    const json = await res.json();
    if (!json.success) {
      setBatchError(json.error?.message || "Gagal menambah batch");
      return;
    }
    setShowBatch(null);
    setBatchForm(emptyBatch);
    load();
  }

  async function predictStock(m: MedicineRow) {
    setPredicting(m._id);
    setPrediction(null);
    try {
      const res = await fetch("/api/ai/stock-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: m._id }),
      });
      const json = await res.json();
      if (json.success) {
        const p = json.data;
        setPrediction({
          id: m._id,
          text: `Perkiraan kebutuhan 30 hari: ${p.predictedNeed30Days} ${m.unit} (terjual ${p.totalSold30Days} bulan lalu). ${
            p.reorderRecommended ? "⚠️ Disarankan reorder sekarang." : "Stok masih aman."
          } ${p.reasoning}`,
        });
      } else {
        alert(json.error?.message);
      }
    } finally {
      setPredicting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Farmasi & Stok Obat</h1>
          <p className="text-dark/60">Kelola stok obat per cabang dan transfer antar cabang.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Obat</Button>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Nama Obat</th>
                <th className="py-2 pr-4">Cabang</th>
                <th className="py-2 pr-4">Stok</th>
                <th className="py-2 pr-4">Kadaluarsa Terdekat</th>
                <th className="py-2 pr-4">Harga Jual</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && medicines.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-dark/40">Belum ada data obat</td></tr>
              )}
              {medicines.map((m) => {
                const expiry = nearestExpiry(m.batches);
                const expiryDays = expiry ? daysUntil(expiry.expiredDate) : null;
                return (
                <Fragment key={m._id}>
                  <tr className="border-b border-dark/5 last:border-0">
                    <td className="py-3 pr-4 font-medium text-dark">{m.name}</td>
                    <td className="py-3 pr-4 text-dark/70">{m.branchId?.name || "-"}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={m.stock.current <= m.stock.minimum ? "red" : "green"}>
                        {m.stock.current} {m.unit}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {expiry ? (
                        <Badge tone={expiryDays !== null && expiryDays <= 30 ? "red" : "gray"}>
                          {new Date(expiry.expiredDate).toLocaleDateString("id-ID")}
                          {expiryDays !== null && expiryDays <= 30 && ` (${expiryDays}h lagi)`}
                        </Badge>
                      ) : (
                        <span className="text-dark/30 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-dark/70">Rp {m.pricing.sellPrice.toLocaleString("id-ID")}</td>
                    <td className="py-3 pr-4 text-right space-x-3">
                      <button onClick={() => predictStock(m)} disabled={predicting === m._id} className="text-dark/60 font-medium hover:text-green cursor-pointer disabled:opacity-50">
                        {predicting === m._id ? "..." : "✨ Prediksi"}
                      </button>
                      <button onClick={() => setShowBatch(m)} className="text-dark/60 font-medium hover:text-green cursor-pointer">
                        + Batch
                      </button>
                      <button onClick={() => setShowTransfer(m)} className="text-green font-medium hover:underline cursor-pointer">
                        Transfer
                      </button>
                    </td>
                  </tr>
                  {prediction?.id === m._id && (
                    <tr className="bg-lime/10">
                      <td colSpan={6} className="px-4 py-2 text-xs text-dark/80">{prediction.text}</td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Obat</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Nama Obat</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Satuan</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div>
                  <Label>Stok Awal</Label>
                  <Input type="number" min={0} value={form.current} onChange={(e) => setForm({ ...form, current: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Stok Minimum</Label>
                  <Input type="number" min={0} value={form.minimum} onChange={(e) => setForm({ ...form, minimum: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga Beli</Label>
                  <Input type="number" min={0} value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Harga Jual</Label>
                  <Input type="number" min={0} value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "Menyimpan..." : "Simpan"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-1">Transfer Stok</h2>
            <p className="text-dark/60 text-sm mb-4">{showTransfer.name} — stok saat ini {showTransfer.stock.current} {showTransfer.unit}</p>
            <form onSubmit={doTransfer} className="space-y-4">
              <div>
                <Label>Cabang Tujuan</Label>
                <Select required value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                  <option value="">Pilih cabang</option>
                  {branches.filter((b) => b._id !== showTransfer.branchId?._id).map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input type="number" min={1} max={showTransfer.stock.current} required value={transferQty} onChange={(e) => setTransferQty(Number(e.target.value))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Transfer</Button>
                <Button type="button" variant="ghost" onClick={() => setShowTransfer(null)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showBatch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-1">Tambah Batch</h2>
            <p className="text-dark/60 text-sm mb-4">{showBatch.name}</p>
            <form onSubmit={addBatch} className="space-y-4">
              <div>
                <Label>No. Batch</Label>
                <Input required value={batchForm.batchNo} onChange={(e) => setBatchForm({ ...batchForm, batchNo: e.target.value })} />
              </div>
              <div>
                <Label>Tanggal Kadaluarsa</Label>
                <Input type="date" required value={batchForm.expiredDate} onChange={(e) => setBatchForm({ ...batchForm, expiredDate: e.target.value })} />
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input type="number" min={1} required value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })} />
              </div>
              {batchError && <p className="text-red-500 text-sm">{batchError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Simpan (otomatis nambah stok)</Button>
                <Button type="button" variant="ghost" onClick={() => setShowBatch(null)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
