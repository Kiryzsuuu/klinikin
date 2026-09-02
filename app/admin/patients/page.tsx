"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, Select } from "@/components/ui";

type Branch = { _id: string; name: string };
type PatientRow = {
  _id: string;
  medicalRecordNo: string;
  name: string;
  phone?: string;
  gender: string;
  registeredBranchId?: { name: string };
};

const emptyForm = {
  registeredBranchId: "",
  name: "",
  phone: "",
  gender: "L",
  nik: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setPatients(json.data);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + search
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
       
      .then((json) => json.success && setBranches(json.data));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan pasien");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Data Pasien</h1>
          <p className="text-dark/60">Pasien terpusat lintas cabang.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/patients" className="px-4 py-2.5 rounded-sm border border-dark/15 text-dark/70 hover:bg-dark/5 text-sm font-medium">
            Export CSV
          </a>
          <Button onClick={() => setShowForm(true)}>+ Pasien Baru</Button>
        </div>
      </div>

      <Card>
        <Input placeholder="Cari nama, No. RM, atau NIK..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-4" />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">No. RM</th>
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Cabang Daftar</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && patients.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-dark/40">Belum ada pasien</td></tr>
              )}
              {patients.map((p) => (
                <tr key={p._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 text-dark/70">{p.medicalRecordNo}</td>
                  <td className="py-3 pr-4 font-medium text-dark">{p.name}</td>
                  <td className="py-3 pr-4 text-dark/70">{p.phone || "-"}</td>
                  <td className="py-3 pr-4 text-dark/70">{p.registeredBranchId?.name || "-"}</td>
                  <td className="py-3 pr-4 text-right">
                    <Link href={`/admin/patients/${p._id}`} className="text-green font-medium hover:underline">
                      Lihat RME
                    </Link>
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
            <h2 className="text-xl font-semibold text-dark mb-4">Pasien Baru</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Cabang Pendaftaran</Label>
                <Select required value={form.registeredBranchId} onChange={(e) => setForm({ ...form, registeredBranchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Nama Lengkap</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telepon</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Jenis Kelamin</Label>
                  <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>NIK</Label>
                <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
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
