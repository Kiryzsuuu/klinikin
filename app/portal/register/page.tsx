"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

export default function PortalRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ medicalRecordNo: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patient-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal mendaftar");
        return;
      }
      router.push(`/portal/verify-otp?medicalRecordNo=${encodeURIComponent(form.medicalRecordNo)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-dark mb-1">Daftar Portal Pasien</h1>
        <p className="text-dark/60 mb-6 text-sm">
          Gunakan No. Rekam Medis dan No. Telepon yang sudah tercatat di klinik (dari kunjungan/booking sebelumnya).
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mrn">No. Rekam Medis</Label>
            <Input id="mrn" required placeholder="KH-2026-000001" value={form.medicalRecordNo} onChange={(e) => setForm({ ...form, medicalRecordNo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="phone">No. Telepon (sesuai data klinik)</Label>
            <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="password">Buat Password</Label>
            <Input id="password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Memproses..." : "Daftar & Kirim OTP"}
          </Button>
        </form>

        <p className="text-sm text-dark/60 mt-6 text-center">
          Sudah punya akun? <Link href="/portal/login" className="text-green font-medium">Masuk</Link>
        </p>
        <p className="text-xs text-dark/40 mt-2 text-center">
          Belum pernah berobat? <Link href="/booking" className="text-green">Booking konsultasi dulu</Link>
        </p>
      </Card>
    </main>
  );
}
