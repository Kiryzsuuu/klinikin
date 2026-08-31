"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

export default function PortalLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ medicalRecordNo: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patient-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal masuk");
        return;
      }
      router.push("/portal/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-dark mb-1">Portal Pasien</h1>
        <p className="text-dark/60 mb-6 text-sm">Masuk untuk lihat riwayat medis & booking Anda.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mrn">No. Rekam Medis</Label>
            <Input id="mrn" required value={form.medicalRecordNo} onChange={(e) => setForm({ ...form, medicalRecordNo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="flex justify-between text-sm mt-6">
          <Link href="/portal/forgot-password" className="text-dark/60 hover:text-green">Lupa password?</Link>
          <Link href="/portal/register" className="text-green font-medium">Daftar</Link>
        </div>
      </Card>
    </main>
  );
}
