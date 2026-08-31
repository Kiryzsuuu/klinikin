"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

export default function PortalForgotPasswordPage() {
  const router = useRouter();
  const [medicalRecordNo, setMedicalRecordNo] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/patient-auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalRecordNo }),
      });
      router.push(`/portal/verify-otp?medicalRecordNo=${encodeURIComponent(medicalRecordNo)}&purpose=PATIENT_RESET_PASSWORD`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-dark mb-1">Lupa Password</h1>
        <p className="text-dark/60 mb-6 text-sm">Masukkan No. Rekam Medis Anda.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mrn">No. Rekam Medis</Label>
            <Input id="mrn" required value={medicalRecordNo} onChange={(e) => setMedicalRecordNo(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Mengirim..." : "Kirim Kode OTP"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
