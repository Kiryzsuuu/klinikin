"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const medicalRecordNo = params.get("medicalRecordNo") || "";
  const purpose = (params.get("purpose") || "PATIENT_REGISTER") as "PATIENT_REGISTER" | "PATIENT_RESET_PASSWORD";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patient-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalRecordNo, code, purpose }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Kode OTP tidak valid");
        return;
      }
      if (purpose === "PATIENT_RESET_PASSWORD") {
        router.push(`/portal/reset-password?medicalRecordNo=${encodeURIComponent(medicalRecordNo)}&code=${code}`);
      } else {
        router.push("/portal/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-dark mb-1">Verifikasi OTP</h1>
      <p className="text-dark/60 mb-6 text-sm">Masukkan kode OTP yang dikirim ke email Anda.</p>
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      </form>
    </Card>
  );
}

export default function PortalVerifyOtpPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
