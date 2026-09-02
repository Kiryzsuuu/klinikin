"use client";

import { useEffect, useState, use } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";

type Branch = { _id: string; name: string };
type Clinic = { _id: string; name: string; logoBase64?: string };

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    branchId: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    complaint: "",
    preferredDate: "",
    consultationType: "ONSITE",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/clinics/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        setClinic(j.data);
        return fetch(`/api/branches?clinicId=${j.data._id}`)
          .then((r) => r.json())
          .then((bj) => bj.success && setBranches(bj.data));
      });
  }, [slug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinic) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clinicId: clinic._id }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal mengirim booking");
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-semibold text-dark mb-2">Booking Diterima</h1>
          <p className="text-dark/60">Tim klinik akan segera mengonfirmasi jadwal Anda via telepon/email.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-dark mb-1">Booking Konsultasi</h1>
        <p className="text-dark/60 mb-6 text-sm">
          {clinic ? clinic.name : "Memuat..."}, tidak perlu buat akun.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Cabang</Label>
            <Select required value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Pilih cabang</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Nama Lengkap</Label>
            <Input required value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>No. Telepon</Label>
              <Input required value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} />
            </div>
            <div>
              <Label>Email (opsional)</Label>
              <Input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Keluhan</Label>
            <textarea
              className="w-full px-4 py-2.5 rounded-sm border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
              rows={3}
              value={form.complaint}
              onChange={(e) => setForm({ ...form, complaint: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal & Jam</Label>
              <Input type="datetime-local" required value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </div>
            <div>
              <Label>Jenis Konsultasi</Label>
              <Select value={form.consultationType} onChange={(e) => setForm({ ...form, consultationType: e.target.value })}>
                <option value="ONSITE">Datang Langsung</option>
                <option value="ONLINE">Konsultasi Online</option>
              </Select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading || !clinic} className="w-full">
            {loading ? "Mengirim..." : "Kirim Booking"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
