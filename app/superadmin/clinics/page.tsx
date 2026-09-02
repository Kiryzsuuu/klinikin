"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, Badge } from "@/components/ui";

type ClinicRow = {
  _id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  isActive: boolean;
  subscription?: { status: string; trialEndsAt?: string };
};

const emptyForm = { name: "", ownerEmail: "" };

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/clinics${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      const json = await res.json();
      if (json.success) setClinics(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load("");
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menambah klinik");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load(q);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: ClinicRow) {
    const res = await fetch(`/api/superadmin/clinics/${c._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    const json = await res.json();
    if (json.success) load(q);
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Klinik</h1>
          <p className="text-dark/60">Semua klinik yang terdaftar di KlinikKita.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Tambah Klinik</Button>
      </div>

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Cari nama atau slug klinik..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              load(e.target.value);
            }}
          />
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Aktif</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-dark/40">Memuat...</td>
                </tr>
              )}
              {!loading && clinics.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-dark/40">Belum ada klinik</td>
                </tr>
              )}
              {clinics.map((c) => (
                <tr key={c._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-dark">
                    <Link href={`/superadmin/clinics/${c._id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-dark/70">{c.slug}</td>
                  <td className="py-3 pr-4 text-dark/70">{c.ownerEmail}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={c.subscription?.status === "ACTIVE" ? "green" : c.subscription?.status === "TRIAL" ? "lime" : "red"}>
                      {c.subscription?.status || "TRIAL"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={c.isActive ? "green" : "gray"}>{c.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <button onClick={() => toggleActive(c)} className="text-red-500 font-medium hover:underline cursor-pointer">
                      {c.isActive ? "Nonaktifkan" : "Aktifkan"}
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
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Klinik Baru</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Nama Klinik</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Email Owner</Label>
                <Input
                  type="email"
                  required
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                />
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
