"use client";

import { useEffect, useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { FEATURE_LABELS } from "@/lib/features";

declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: Record<string, unknown>) => void };
  }
}

type Plan = {
  _id: string;
  name: string;
  priceMonthly: number;
  maxBranches: number;
  maxUsers: number;
  features: string[];
};

type Me = {
  clinic?: { name: string; subscription?: { status: string; trialEndsAt?: string; currentPeriodEnd?: string } };
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/superadmin/plans").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([plansJson, meJson]) => {
        if (plansJson.success) setPlans(plansJson.data);
        if (meJson.success) setMe(meJson.data);
      })
      .finally(() => setLoading(false));

    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const script = document.createElement("script");
    script.src = isProduction ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function subscribe(planId: string) {
    setError("");
    setPayingId(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal memulai pembayaran");
        return;
      }
      if (window.snap) {
        window.snap.pay(json.data.token);
      } else {
        window.location.href = json.data.redirectUrl;
      }
    } finally {
      setPayingId(null);
    }
  }

  const status = me?.clinic?.subscription?.status || "TRIAL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Langganan & Billing</h1>
        <p className="text-dark/60">Status saat ini: <Badge tone={status === "ACTIVE" ? "green" : status === "TRIAL" ? "lime" : "red"}>{status}</Badge></p>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {loading && <p className="text-dark/40 text-sm">Memuat paket...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p._id}>
            <h3 className="font-semibold text-dark mb-2">{p.name}</h3>
            <p className="text-2xl font-semibold text-green mb-3">
              Rp {p.priceMonthly.toLocaleString("id-ID")}<span className="text-sm text-dark/50">/bulan</span>
            </p>
            <ul className="text-sm text-dark/70 space-y-2 mb-4">
              <li className="pl-3 border-l-2 border-green">Maks {p.maxBranches} cabang</li>
              <li className="pl-3 border-l-2 border-green">Maks {p.maxUsers} pengguna</li>
              {p.features.map((f) => <li key={f} className="pl-3 border-l-2 border-green">{FEATURE_LABELS[f] || f}</li>)}
            </ul>
            <Button className="w-full" disabled={payingId === p._id} onClick={() => subscribe(p._id)}>
              {payingId === p._id ? "Memproses..." : "Berlangganan"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
