"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

type Branch = { _id: string; name: string };
type PatientOpt = { _id: string; name: string; medicalRecordNo: string };
type InvoiceRow = {
  _id: string;
  invoiceNo: string;
  total: number;
  payment: { status: string; method: string };
  patientId?: { name: string };
  branchId?: { name: string };
  createdAt: string;
};

type ItemForm = { type: string; name: string; quantity: number; unitPrice: number };

const emptyForm = { branchId: "", patientId: "", method: "CASH" };

export default function CashierPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ItemForm[]>([{ type: "CONSULTATION", name: "Konsultasi Dokter", quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const json = await res.json();
      if (json.success) setInvoices(json.data);
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

  function updateItem(i: number, patch: Partial<ItemForm>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: form.branchId,
          patientId: form.patientId,
          items,
          payment: { method: form.method },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal membuat invoice");
        return;
      }
      setShowForm(false);
      setForm(emptyForm);
      setItems([{ type: "CONSULTATION", name: "Konsultasi Dokter", quantity: 1, unitPrice: 0 }]);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(id: string, total: number) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAmount: total }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Kasir & Invoice</h1>
          <p className="text-dark/60">Buat invoice dan kelola pembayaran.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/invoices" className="px-4 py-2.5 rounded-sm border border-dark/15 text-dark/70 hover:bg-dark/5 text-sm font-medium">
            Export CSV
          </a>
          <Button onClick={() => setShowForm(true)}>+ Invoice Baru</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">No. Invoice</th>
                <th className="py-2 pr-4">Pasien</th>
                <th className="py-2 pr-4">Cabang</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-dark/40">Belum ada invoice</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 text-dark/70">{inv.invoiceNo}</td>
                  <td className="py-3 pr-4 font-medium text-dark">{inv.patientId?.name}</td>
                  <td className="py-3 pr-4 text-dark/70">{inv.branchId?.name}</td>
                  <td className="py-3 pr-4 text-dark/70">Rp {inv.total.toLocaleString("id-ID")}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={inv.payment.status === "PAID" ? "green" : "lime"}>{inv.payment.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {inv.payment.status !== "PAID" && (
                      <button onClick={() => markPaid(inv._id, inv.total)} className="text-green font-medium hover:underline cursor-pointer">
                        Tandai Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-xl font-semibold text-dark mb-4">Invoice Baru</h2>
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

              <div className="space-y-2">
                <Label>Item Tagihan</Label>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_90px] gap-2">
                    <Input placeholder="Nama item" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
                    <Input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                    <Input type="number" min={0} placeholder="Harga" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setItems([...items, { type: "OTHER", name: "", quantity: 1, unitPrice: 0 }])}
                  className="text-green text-sm font-medium cursor-pointer"
                >
                  + Tambah item
                </button>
              </div>

              <div>
                <Label>Metode Pembayaran</Label>
                <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="CASH">Tunai</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="QRIS">QRIS</option>
                  <option value="BPJS">BPJS</option>
                  <option value="INSURANCE">Asuransi</option>
                </Select>
              </div>

              <p className="text-right font-semibold text-dark">Total: Rp {total.toLocaleString("id-ID")}</p>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "Menyimpan..." : "Buat Invoice"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
