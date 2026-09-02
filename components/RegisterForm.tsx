"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ clinicName: "", name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Terjadi kesalahan");
        return;
      }
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}&purpose=REGISTER`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-dark mb-1">Daftarkan Klinik Anda</h1>
      <p className="text-dark/60 mb-6 text-sm">Coba gratis 14 hari, tanpa kartu kredit.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="clinicName">Nama Klinik</Label>
          <Input
            id="clinicName"
            required
            value={form.clinicName}
            onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="name">Nama Lengkap Anda (Owner)</Label>
          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="phone">No. Telepon (opsional)</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memproses..." : "Daftar & Kirim OTP"}
        </Button>
      </form>

      <p className="text-sm text-dark/60 mt-6 text-center">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-green font-medium">
          Masuk
        </Link>
      </p>
    </Card>
  );
}
