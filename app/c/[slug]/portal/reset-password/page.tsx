"use client";

import { Suspense, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

function ResetForm({ slug }: { slug: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const medicalRecordNo = params.get("medicalRecordNo") || "";
  const code = params.get("code") || "";

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patient-auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalRecordNo, code, newPassword, clinicSlug: slug }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal reset password");
        return;
      }
      router.push(`/c/${slug}/portal/login`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-dark mb-1">Password Baru</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="newPassword">Password Baru</Label>
          <Input id="newPassword" type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Menyimpan..." : "Simpan Password"}
        </Button>
      </form>
    </Card>
  );
}

export default function PortalResetPasswordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Suspense>
        <ResetForm slug={slug} />
      </Suspense>
    </main>
  );
}
