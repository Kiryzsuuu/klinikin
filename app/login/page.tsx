"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        if (json.error?.code === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-otp?email=${encodeURIComponent(form.email)}&purpose=REGISTER`);
          return;
        }
        setError(json.error?.message || "Terjadi kesalahan");
        return;
      }
      if (json.data.mfaRequired) {
        setMfaToken(json.data.mfaToken);
        return;
      }
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Kode MFA salah");
        return;
      }
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  if (mfaToken) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-dark mb-1">Verifikasi MFA</h1>
          <p className="text-dark/60 mb-6 text-sm">Masukkan kode 6 digit dari aplikasi authenticator Anda.</p>
          <form onSubmit={onVerifyMfa} className="space-y-4">
            <Input
              required
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-semibold"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-dark mb-1">Masuk</h1>
        <p className="text-dark/60 mb-6 text-sm">Selamat datang kembali di KlinikHub.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
          <Link href="/forgot-password" className="text-dark/60 hover:text-green">
            Lupa password?
          </Link>
          <Link href="/register" className="text-green font-medium">
            Daftar akun
          </Link>
        </div>
      </Card>
    </main>
  );
}
