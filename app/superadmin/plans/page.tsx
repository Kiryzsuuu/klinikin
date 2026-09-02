"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Badge } from "@/components/ui";
import { FEATURE_KEYS, FEATURE_LABELS, CORE_FEATURES } from "@/lib/features";

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

type FormState = {
  name: string;
  slug: string;
  priceMonthly: string;
  maxBranches: string;
  maxUsers: string;
  features: string[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  priceMonthly: "",
  maxBranches: "1",
  maxUsers: "5",
  features: [...CORE_FEATURES],
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Plan) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      priceMonthly: String(p.priceMonthly),
      maxBranches: String(p.maxBranches),
      maxUsers: String(p.maxUsers),
      features: p.features,
    });
    setError("");
    setShowForm(true);
  }

  function toggleFeature(key: string) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(key) ? f.features.filter((k) => k !== key) : [...f.features, key],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        priceMonthly: Number(form.priceMonthly),
        maxBranches: Number(form.maxBranches),
        maxUsers: Number(form.maxUsers),
        features: form.features,
        ...(editingId ? {} : { slug: form.slug }),
      };
      const res = await fetch(editingId ? `/api/superadmin/plans/${editingId}` : "/api/superadmin/plans", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan paket");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
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

  async function reactivate(id: string) {
    const res = await fetch(`/api/superadmin/plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
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
        <Button onClick={openCreate}>+ Tambah Paket</Button>
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
            <ul className="text-sm text-dark/70 space-y-2 mb-4">
              <li className="pl-3 border-l-2 border-green">Maks {p.maxBranches} cabang</li>
              <li className="pl-3 border-l-2 border-green">Maks {p.maxUsers} pengguna</li>
              {p.features.map((f) => (
                <li key={f} className="pl-3 border-l-2 border-green">{FEATURE_LABELS[f] || f}</li>
              ))}
              {p.features.length === 0 && <li className="pl-3 border-l-2 border-dark/10 text-dark/40">Tanpa fitur premium</li>}
            </ul>
            <div className="flex gap-4">
              <button onClick={() => openEdit(p)} className="text-green text-sm font-medium hover:underline cursor-pointer">
                Edit
              </button>
              {p.isActive ? (
                <button onClick={() => deactivate(p._id)} className="text-red-500 text-sm font-medium hover:underline cursor-pointer">
                  Nonaktifkan
                </button>
              ) : (
                <button onClick={() => reactivate(p._id)} className="text-green text-sm font-medium hover:underline cursor-pointer">
                  Aktifkan
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-dark mb-4">{editingId ? "Edit Paket" : "Tambah Paket"}</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Nama Paket</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug (unik)</Label>
                <Input
                  required
                  disabled={!!editingId}
                  placeholder="starter"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                {editingId && <p className="text-xs text-dark/40 mt-1">Slug tidak bisa diubah setelah dibuat.</p>}
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
                <Label>Modul & Fitur</Label>
                <div className="space-y-2 border border-dark/15 rounded-sm p-3">
                  {FEATURE_KEYS.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm text-dark/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.features.includes(f.key)}
                        onChange={() => toggleFeature(f.key)}
                      />
                      {f.label}
                      {(CORE_FEATURES as readonly string[]).includes(f.key) && (
                        <span className="text-[10px] uppercase tracking-wide text-dark/40">Inti</span>
                      )}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-dark/40 mt-1">
                  Hanya modul yang dicentang yang terbuka untuk klinik dengan paket ini — tidak ada yang otomatis
                  terbuka, termasuk modul inti (RME, farmasi, kasir, booking). Selama trial, modul inti tetap
                  terbuka otomatis tanpa perlu paket.
                </p>
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
