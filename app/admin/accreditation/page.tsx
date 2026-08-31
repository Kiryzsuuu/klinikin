"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

type Branch = { _id: string; name: string };
type Item = {
  _id: string;
  category: string;
  item: string;
  status: string;
  note?: string;
  evidenceBase64?: string;
  branchId?: { name: string };
};

export default function AccreditationPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ branchId: "", category: "", item: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accreditation");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json())
       
      .then((j) => j.success && setBranches(j.data));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/accreditation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Gagal menambah item");
      return;
    }
    setShowForm(false);
    setForm({ branchId: "", category: "", item: "" });
    load();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/accreditation/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) load();
  }

  async function uploadEvidence(id: string, file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    const res = await fetch(`/api/accreditation/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evidenceBase64: base64, evidenceFileName: file.name }),
    });
    const json = await res.json();
    if (json.success) load();
  }

  const total = items.length;
  const done = items.filter((i) => i.status === "SELESAI").length;
  const grouped = items.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Checklist Akreditasi</h1>
          <p className="text-dark/60">Susun & lacak progres kesiapan akreditasi per cabang.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Item</Button>
      </div>

      <Card className="bg-dark text-white">
        <p className="text-sm text-white/60">Progres Keseluruhan</p>
        <p className="text-2xl font-semibold text-lime mt-1">{done} / {total} selesai</p>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-lime" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </Card>

      {loading && <Card><p className="text-dark/40 text-center">Memuat...</p></Card>}
      {!loading && Object.keys(grouped).length === 0 && <Card><p className="text-dark/40 text-center">Belum ada item checklist</p></Card>}

      {Object.entries(grouped).map(([category, catItems]) => (
        <Card key={category}>
          <h2 className="font-semibold text-dark mb-3">{category}</h2>
          <div className="space-y-3">
            {catItems.map((i) => (
              <div key={i._id} className="border-b border-dark/5 last:border-0 pb-3 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-dark">{i.item}</p>
                    <p className="text-xs text-dark/40">{i.branchId?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={i.status} onChange={(e) => updateStatus(i._id, e.target.value)} className="w-32 text-sm">
                      <option value="BELUM">BELUM</option>
                      <option value="PROSES">PROSES</option>
                      <option value="SELESAI">SELESAI</option>
                    </Select>
                    <input type="file" accept="image/*" onChange={(e) => uploadEvidence(i._id, e.target.files?.[0])} className="text-xs w-32" />
                  </div>
                </div>
                {i.evidenceBase64 && <Badge tone="green">Bukti terlampir</Badge>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Item Checklist</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div><Label>Kategori</Label><Input required placeholder="Manajemen Klinik, Keselamatan Pasien, dll" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Item</Label><Input required value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
