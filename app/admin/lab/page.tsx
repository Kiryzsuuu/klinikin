"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

type Branch = { _id: string; name: string };
type PatientOpt = { _id: string; name: string; medicalRecordNo: string };
type OrderRow = {
  _id: string;
  testName: string;
  category: string;
  status: string;
  notes?: string;
  resultText?: string;
  resultFileBase64?: string;
  createdAt: string;
  patientId?: { name: string; medicalRecordNo: string };
  branchId?: { name: string };
};

const emptyForm = { branchId: "", patientId: "", category: "LAB", testName: "", notes: "" };

export default function LabPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab-orders");
      const json = await res.json();
      if (json.success) setOrders(json.data);
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
    fetch("/api/patients?limit=100").then((r) => r.json())
      .then((j) => j.success && setPatients(j.data));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal membuat order");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/lab-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  async function saveResult(id: string) {
    const res = await fetch(`/api/lab-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE", resultText: resultDraft[id] || "" }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  async function uploadResultFile(id: string, file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    const res = await fetch(`/api/lab-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultFileBase64: base64, resultFileName: file.name }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Laboratorium & Radiologi</h1>
          <p className="text-dark/60">Kelola permintaan dan hasil pemeriksaan pasien.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Order Baru</Button>
      </div>

      <div className="space-y-3">
        {loading && <Card><p className="text-dark/40 text-center">Memuat...</p></Card>}
        {!loading && orders.length === 0 && <Card><p className="text-dark/40 text-center">Belum ada order</p></Card>}
        {orders.map((o) => (
          <Card key={o._id}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-medium text-dark">{o.testName} <Badge tone="lime">{o.category}</Badge></p>
                <p className="text-xs text-dark/50">
                  {o.patientId?.name} ({o.patientId?.medicalRecordNo}) • {o.branchId?.name} • {new Date(o.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <Badge tone={o.status === "DONE" ? "green" : o.status === "CANCELLED" ? "gray" : "lime"}>{o.status}</Badge>
            </div>
            {o.notes && <p className="text-sm text-dark/70 mb-2">Catatan: {o.notes}</p>}

            {o.status !== "DONE" && o.status !== "CANCELLED" && (
              <div className="border-t border-dark/10 pt-3 mt-2 space-y-2">
                <div className="flex gap-2">
                  {o.status === "REQUESTED" && (
                    <Button type="button" variant="secondary" onClick={() => updateStatus(o._id, "PROCESSING")} className="!px-3 !py-1.5 text-xs">
                      Mulai Proses
                    </Button>
                  )}
                </div>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
                  rows={2}
                  placeholder="Hasil pemeriksaan..."
                  value={resultDraft[o._id] ?? ""}
                  onChange={(e) => setResultDraft({ ...resultDraft, [o._id]: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={() => saveResult(o._id)} className="!px-3 !py-1.5 text-xs">
                    Simpan & Tandai Selesai
                  </Button>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => uploadResultFile(o._id, e.target.files?.[0])} className="text-xs" />
                </div>
              </div>
            )}

            {o.resultText && <p className="text-sm text-dark mt-2"><b>Hasil:</b> {o.resultText}</p>}
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Order Lab/Radiologi Baru</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Pasien</Label>
                <Select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">Pilih pasien</option>
                  {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.medicalRecordNo})</option>)}
                </Select>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="LAB">Laboratorium</option>
                  <option value="RADIOLOGI">Radiologi</option>
                </Select>
              </div>
              <div>
                <Label>Nama Pemeriksaan</Label>
                <Input required placeholder="Darah Lengkap, Rontgen Thorax, dll" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
              </div>
              <div>
                <Label>Catatan (opsional)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "Menyimpan..." : "Buat Order"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
