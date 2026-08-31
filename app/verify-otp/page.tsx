"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const purpose = (params.get("purpose") || "REGISTER") as "REGISTER" | "LOGIN" | "RESET_PASSWORD";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Kode OTP tidak valid");
        return;
      }

      if (purpose === "RESET_PASSWORD") {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      } else {
        router.push("/admin");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const json = await res.json();
      setInfo(json.success ? "Kode OTP baru telah dikirim." : json.error?.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-dark mb-1">Verifikasi OTP</h1>
      <p className="text-dark/60 mb-6 text-sm">
        Masukkan kode 6 digit yang dikirim ke <span className="font-medium text-dark">{email}</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="code">Kode OTP</Label>
          <Input
            id="code"
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.5em] font-semibold"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {info && <p className="text-green text-sm">{info}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      </form>

      <button
        onClick={resend}
        disabled={resending}
        className="text-sm text-dark/60 mt-4 w-full text-center hover:text-green disabled:opacity-50 cursor-pointer"
      >
        {resending ? "Mengirim ulang..." : "Kirim ulang kode OTP"}
      </button>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Suspense>
        <VerifyOtpForm />
      </Suspense>
    </main>
  );
}
