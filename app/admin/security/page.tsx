"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, Input, Label } from "@/components/ui";

type Me = { mfaEnabled: boolean; role: string };

export default function SecurityPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    const json = await res.json();
    if (json.success) setMe(json.data.user);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadMe();
  }, []);

  async function startSetup() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal memulai setup MFA");
        return;
      }
      setQrCode(json.data.qrCodeDataUrl);
      setSecret(json.data.secret);
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Kode salah");
        return;
      }
      setMessage("MFA berhasil diaktifkan.");
      setQrCode("");
      setCode("");
      loadMe();
    } finally {
      setLoading(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Kode salah");
        return;
      }
      setMessage("MFA dinonaktifkan.");
      setCode("");
      loadMe();
    } finally {
      setLoading(false);
    }
  }

  if (!me) return <p className="text-dark/50">Memuat...</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Keamanan Akun</h1>
        <p className="text-dark/60">Multi-Factor Authentication (MFA) sangat disarankan untuk role Owner & Admin Pusat.</p>
      </div>

      <Card>
        {me.mfaEnabled ? (
          <>
            <p className="text-green font-medium mb-1">✅ MFA Aktif</p>
            <p className="text-sm text-dark/60 mb-4">Masukkan kode dari authenticator untuk menonaktifkan.</p>
            <form onSubmit={disable} className="space-y-3">
              <Input
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.4em]"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green text-sm">{message}</p>}
              <Button type="submit" variant="danger" disabled={loading}>
                {loading ? "Memproses..." : "Nonaktifkan MFA"}
              </Button>
            </form>
          </>
        ) : qrCode ? (
          <>
            <p className="font-medium text-dark mb-1">Scan QR Code</p>
            <p className="text-sm text-dark/60 mb-4">
              Gunakan Google Authenticator / Authy, lalu masukkan kode 6 digit yang muncul.
            </p>
            <Image src={qrCode} alt="QR MFA" width={200} height={200} unoptimized className="mx-auto mb-3" />
            <p className="text-xs text-dark/40 text-center mb-4 font-mono break-all">{secret}</p>
            <form onSubmit={confirmEnable} className="space-y-3">
              <Label>Kode dari Authenticator</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-xl tracking-[0.4em]"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Memverifikasi..." : "Aktifkan MFA"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="text-dark/60 mb-4">MFA belum aktif untuk akun ini.</p>
            {message && <p className="text-green text-sm mb-3">{message}</p>}
            <Button onClick={startSetup} disabled={loading}>
              {loading ? "Memuat..." : "Aktifkan MFA"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
