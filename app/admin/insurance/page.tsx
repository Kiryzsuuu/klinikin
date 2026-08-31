"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Select, Badge } from "@/components/ui";

type Branch = { _id: string; name: string };
type PatientOpt = { _id: string; name: string; medicalRecordNo: string };
type Provider = { _id: string; name: string; contactPhone?: string };
type Claim = {
  _id: string;
  claimAmount: number;
  status: string;
  policyNo?: string;
  patientId?: { name: string };
  providerId?: { name: string };
  branchId?: { name: string };
};

export default function InsurancePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProviderForm, setShowProviderForm] = useState(false);
  const [providerForm, setProviderForm] = useState({ name: "", contactPerson: "", contactPhone: "" });

  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState({ branchId: "", patientId: "", providerId: "", policyNo: "", claimAmount: 0 });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([fetch("/api/insurance/providers"), fetch("/api/insurance/claims")]);
      const pJson = await pRes.json();
      const cJson = await cRes.json();
      if (pJson.success) setProviders(pJson.data);
      if (cJson.success) setClaims(cJson.data);
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

  async function submitProvider(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/insurance/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(providerForm),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Gagal menambah provider");
      return;
    }
    setShowProviderForm(false);
    setProviderForm({ name: "", contactPerson: "", contactPhone: "" });
    load();
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/insurance/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claimForm),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Gagal membuat klaim");
      return;
    }
    setShowClaimForm(false);
    setClaimForm({ branchId: "", patientId: "", providerId: "", policyNo: "", claimAmount: 0 });
    load();
  }

  async function updateClaimStatus(id: string, status: string) {
    const res = await fetch(`/api/insurance/claims/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Asuransi Swasta</h1>
        <p className="text-dark/60">
          Kelola daftar provider asuransi dan lacak status klaim manual (tidak ada API generik antar-insurer, jadi submit klaim ke masing-masing portal dilakukan manual di luar sistem).
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark">Provider Asuransi</h2>
          <Button onClick={() => setShowProviderForm(true)} className="!px-3 !py-1.5 text-sm">+ Tambah Provider</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <Badge key={p._id} tone="lime">{p.name}</Badge>
          ))}
          {providers.length === 0 && <p className="text-dark/40 text-sm">Belum ada provider</p>}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-dark">Klaim</h2>
          <Button onClick={() => setShowClaimForm(true)}>+ Klaim Baru</Button>
        </div>
        <div className="space-y-3">
          {loading && <Card><p className="text-dark/40 text-center">Memuat...</p></Card>}
          {!loading && claims.length === 0 && <Card><p className="text-dark/40 text-center">Belum ada klaim</p></Card>}
          {claims.map((c) => (
            <Card key={c._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-dark">{c.patientId?.name} • {c.providerId?.name}</p>
                  <p className="text-xs text-dark/50">{c.branchId?.name} • Polis {c.policyNo || "-"} • Rp {c.claimAmount.toLocaleString("id-ID")}</p>
                </div>
                <Select value={c.status} onChange={(e) => updateClaimStatus(c._id, e.target.value)} className="w-40">
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PAID">PAID</option>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showProviderForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Tambah Provider</h2>
            <form onSubmit={submitProvider} className="space-y-4">
              <div><Label>Nama Provider</Label><Input required value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} /></div>
              <div><Label>Contact Person</Label><Input value={providerForm.contactPerson} onChange={(e) => setProviderForm({ ...providerForm, contactPerson: e.target.value })} /></div>
              <div><Label>Telepon</Label><Input value={providerForm.contactPhone} onChange={(e) => setProviderForm({ ...providerForm, contactPhone: e.target.value })} /></div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="ghost" onClick={() => setShowProviderForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showClaimForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Klaim Baru</h2>
            <form onSubmit={submitClaim} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={claimForm.branchId} onChange={(e) => setClaimForm({ ...claimForm, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Pasien</Label>
                <Select required value={claimForm.patientId} onChange={(e) => setClaimForm({ ...claimForm, patientId: e.target.value })}>
                  <option value="">Pilih pasien</option>
                  {patients.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Select required value={claimForm.providerId} onChange={(e) => setClaimForm({ ...claimForm, providerId: e.target.value })}>
                  <option value="">Pilih provider</option>
                  {providers.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
              </div>
              <div><Label>No. Polis</Label><Input value={claimForm.policyNo} onChange={(e) => setClaimForm({ ...claimForm, policyNo: e.target.value })} /></div>
              <div><Label>Jumlah Klaim</Label><Input type="number" min={1} required value={claimForm.claimAmount} onChange={(e) => setClaimForm({ ...claimForm, claimAmount: Number(e.target.value) })} /></div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="ghost" onClick={() => setShowClaimForm(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
