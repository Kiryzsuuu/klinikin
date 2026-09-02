"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button, Card, Select, Badge } from "@/components/ui";

type Detail = {
  clinic: {
    _id: string;
    name: string;
    slug: string;
    ownerEmail: string;
    isActive: boolean;
    subscription?: { status: string; currentPeriodEnd?: string; trialEndsAt?: string };
  };
  users: { _id: string; name: string; email: string; role: string }[];
  branches: { _id: string; name: string; code: string }[];
  payments: { _id: string; orderId: string; amount: number; status: string; createdAt: string }[];
};

const STATUSES = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED"];

export default function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/clinics/${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/clinics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) load();
      else alert(json.error?.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return <p className="text-dark/40 text-sm">Memuat...</p>;

  const { clinic, users, branches, payments } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">{clinic.name}</h1>
          <p className="text-dark/60">{clinic.slug} · {clinic.ownerEmail}</p>
        </div>
        <Link href={`/superadmin/clinics/${clinic._id}/settings`}>
          <Button variant="secondary">⚙️ Site Settings Klinik</Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm text-dark/60 mb-1">Status Langganan</p>
            <Select
              disabled={saving}
              value={clinic.subscription?.status || "TRIAL"}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-48"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="text-sm text-dark/60 mb-1">Akun Klinik</p>
            <Badge tone={clinic.isActive ? "green" : "gray"}>{clinic.isActive ? "Aktif" : "Nonaktif"}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-dark mb-4">Pengguna ({users.length})</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-1.5 border-b border-dark/5 last:border-0">
                <div>
                  <p className="text-sm text-dark">{u.name}</p>
                  <p className="text-xs text-dark/50">{u.email}</p>
                </div>
                <Badge tone="lime">{u.role}</Badge>
              </div>
            ))}
            {users.length === 0 && <p className="text-dark/40 text-sm">Belum ada pengguna</p>}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Cabang ({branches.length})</h2>
          <div className="space-y-2">
            {branches.map((b) => (
              <div key={b._id} className="flex items-center justify-between py-1.5 border-b border-dark/5 last:border-0">
                <span className="text-sm text-dark">{b.name}</span>
                <span className="text-xs text-dark/50">{b.code}</span>
              </div>
            ))}
            {branches.length === 0 && <p className="text-dark/40 text-sm">Belum ada cabang</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Riwayat Pembayaran</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p._id} className="flex items-center justify-between py-1.5 border-b border-dark/5 last:border-0">
              <span className="text-sm text-dark">{p.orderId}</span>
              <span className="text-sm text-dark/60">Rp {p.amount.toLocaleString("id-ID")}</span>
              <Badge tone={p.status === "SUCCESS" ? "green" : p.status === "PENDING" ? "lime" : "red"}>{p.status}</Badge>
            </div>
          ))}
          {payments.length === 0 && <p className="text-dark/40 text-sm">Belum ada pembayaran</p>}
        </div>
      </Card>
    </div>
  );
}
