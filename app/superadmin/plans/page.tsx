"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Badge } from "@/components/ui";

type Plan = {
  _id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxBranches: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
};

const emptyForm = { name: "", slug: "", priceMonthly: "", maxBranches: "1", maxUsers: "5", features: "" };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/plans");
      const json = await res.json();
      if (json.success) setPlans(json.data);
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
      const res = await fetch("/api/superadmin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          priceMonthly: Number(form.priceMonthly),
          maxBranches: Number(form.maxBranches),
          maxUsers: Number(form.maxUsers),
          features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan paket");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Nonaktifkan paket ini?")) return;
    const res = await fetch(`/api/superadmin/plans/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Paket Langganan</h1>
          <p className="text-dark/60">Kelola paket harga yang ditawarkan ke klinik.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Paket</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-dark/40 text-sm">Memuat...</p>}
        {!loading && plans.length === 0 && <p className="text-dark/40 text-sm">Belum ada paket</p>}
        {plans.map((p) => (
          <Card key={p._id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-dark">{p.name}</h3>
              <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <p className="text-2xl font-semibold text-green mb-3">
              Rp {p.priceMonthly.toLocaleString("id-ID")}<span className="text-sm text-dark/50">/bulan</span>
            </p>
            <ul className="text-sm text-dark/70 space-y-1 mb-4">
              <li>Maks {p.maxBranches} cabang</li>
              <li>Maks {p.maxUsers} pengguna</li>
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            {p.isActive && (
              <button onClick={() => deactivate(p._id)} className="text-red-500 text-sm font-medium hover:underline cursor-pointer">
                Nonaktifkan
              </button>
            )}
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Paket</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Nama Paket</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug (unik)</Label>
                <Input required placeholder="starter" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <Label>Harga per Bulan (Rp)</Label>
                <Input required type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Maks Cabang</Label>
                  <Input required type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
                </div>
                <div>
                  <Label>Maks Pengguna</Label>
                  <Input required type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Fitur (pisahkan koma)</Label>
                <Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
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
