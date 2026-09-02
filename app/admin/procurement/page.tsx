"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

type Branch = { _id: string; name: string };
type Supplier = { _id: string; name: string };
type Item = { medicineName: string; quantity: number; unitPrice: number };
type PoRow = {
  _id: string;
  poNo: string;
  total: number;
  status: string;
  supplierId?: { name: string };
  branchId?: { name: string };
};

export default function ProcurementPage() {
  const [pos, setPos] = useState<PoRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", phone: "" });

  const [showPoForm, setShowPoForm] = useState(false);
  const [poForm, setPoForm] = useState({ branchId: "", supplierId: "" });
  const [items, setItems] = useState<Item[]>([{ medicineName: "", quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [poRes, sRes] = await Promise.all([fetch("/api/purchase-orders"), fetch("/api/suppliers")]);
      const poJson = await poRes.json();
      const sJson = await sRes.json();
      if (poJson.success) setPos(poJson.data);
      if (sJson.success) setSuppliers(sJson.data);
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

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function submitSupplier(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierForm),
    });
    const json = await res.json();
    if (json.success) {
      setShowSupplierForm(false);
      setSupplierForm({ name: "", contactPerson: "", phone: "" });
      load();
    } else setError(json.error?.message);
  }

  async function submitPo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...poForm, items }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Gagal membuat PO");
      return;
    }
    setShowPoForm(false);
    setPoForm({ branchId: "", supplierId: "" });
    setItems([{ medicineName: "", quantity: 1, unitPrice: 0 }]);
    load();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Procurement Obat</h1>
        <p className="text-dark/60">Pencatatan pengadaan internal, supplier dan purchase order manual, bukan marketplace pihak ketiga.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark">Supplier</h2>
          <Button onClick={() => setShowSupplierForm(true)} className="!px-3 !py-1.5 text-sm">+ Tambah Supplier</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suppliers.map((s) => <Badge key={s._id} tone="lime">{s.name}</Badge>)}
          {suppliers.length === 0 && <p className="text-dark/40 text-sm">Belum ada supplier</p>}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark">Purchase Order</h2>
          <Button onClick={() => setShowPoForm(true)}>+ PO Baru</Button>
        </div>
        <div className="space-y-3">
          {loading && <Card><p className="text-dark/40 text-center">Memuat...</p></Card>}
          {!loading && pos.length === 0 && <Card><p className="text-dark/40 text-center">Belum ada PO</p></Card>}
          {pos.map((po) => (
            <Card key={po._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-dark">{po.poNo}</p>
                  <p className="text-xs text-dark/50">{po.supplierId?.name} • {po.branchId?.name} • Rp {po.total.toLocaleString("id-ID")}</p>
                </div>
                {po.status === "RECEIVED" ? (
                  <Badge tone="green">RECEIVED</Badge>
                ) : (
                  <Select value={po.status} onChange={(e) => updateStatus(po._id, e.target.value)} className="w-36">
                    <option value="DRAFT">DRAFT</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </Select>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showSupplierForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Supplier</h2>
            <form onSubmit={submitSupplier} className="space-y-4">
              <div><Label>Nama Supplier</Label><Input required value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
              <div><Label>Contact Person</Label><Input value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} /></div>
              <div><Label>Telepon</Label><Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="ghost" onClick={() => setShowSupplierForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showPoForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-xl font-semibold text-dark mb-4">Purchase Order Baru</h2>
            <form onSubmit={submitPo} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={poForm.branchId} onChange={(e) => setPoForm({ ...poForm, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Supplier</Label>
                <Select required value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}>
                  <option value="">Pilih supplier</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Item</Label>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_90px] gap-2">
                    <Input placeholder="Nama obat" value={it.medicineName} onChange={(e) => updateItem(i, { medicineName: e.target.value })} />
                    <Input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                    <Input type="number" min={0} placeholder="Harga" value={it.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} />
                  </div>
                ))}
                <button type="button" onClick={() => setItems([...items, { medicineName: "", quantity: 1, unitPrice: 0 }])} className="text-green text-sm font-medium cursor-pointer">
                  + Tambah item
                </button>
              </div>

              <p className="text-right font-semibold text-dark">Total: Rp {total.toLocaleString("id-ID")}</p>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Buat PO</Button>
                <Button type="button" variant="ghost" onClick={() => setShowPoForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
