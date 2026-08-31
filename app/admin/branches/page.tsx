"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

type BranchRow = {
  _id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  contact?: { phone?: string };
  address?: { city?: string };
};

const emptyForm = {
  name: "",
  code: "",
  type: "PRATAMA",
  city: "",
  phone: "",
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      const json = await res.json();
      if (json.success) setBranches(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          type: form.type,
          address: { city: form.city },
          contact: { phone: form.phone },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan cabang");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function onDeactivate(id: string) {
    if (!confirm("Nonaktifkan cabang ini?")) return;
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Manajemen Cabang</h1>
          <p className="text-dark/60">Tambah dan kelola cabang klinik.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Cabang</Button>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Kode</th>
                <th className="py-2 pr-4">Tipe</th>
                <th className="py-2 pr-4">Kota</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-dark/40">Memuat...</td>
                </tr>
              )}
              {!loading && branches.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-dark/40">Belum ada cabang</td>
                </tr>
              )}
              {branches.map((b) => (
                <tr key={b._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-dark">{b.name}</td>
                  <td className="py-3 pr-4 text-dark/70">{b.code}</td>
                  <td className="py-3 pr-4"><Badge tone="lime">{b.type}</Badge></td>
                  <td className="py-3 pr-4 text-dark/70">{b.address?.city || "-"}</td>
                  <td className="py-3 pr-4 text-dark/70">{b.contact?.phone || "-"}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={b.isActive ? "green" : "gray"}>{b.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button onClick={() => onDeactivate(b._id)} className="text-red-500 font-medium hover:underline cursor-pointer">
                      Nonaktifkan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Cabang</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Nama Cabang</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kode Cabang</Label>
                  <Input required placeholder="KSD-001" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div>
                  <Label>Tipe</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="PRATAMA">PRATAMA</option>
                    <option value="UTAMA">UTAMA</option>
                    <option value="SPESIALIS">SPESIALIS</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Kota</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
