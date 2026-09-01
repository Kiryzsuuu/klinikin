"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge, Input } from "@/components/ui";

type LogRow = {
  _id: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  method: string;
  path: string;
  createdAt: string;
};

const ACTION_TONE: Record<string, "green" | "lime" | "gray" | "red"> = {
  CREATE: "green",
  UPDATE: "lime",
  DELETE: "red",
  VIEW: "gray",
  DEACTIVATE: "red",
  REVOKE: "red",
};

function toneFor(action: string) {
  const key = Object.keys(ACTION_TONE).find((k) => action.includes(k));
  return key ? ACTION_TONE[key] : "gray";
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  const filtered = logs.filter(
    (l) =>
      !q ||
      l.action.toLowerCase().includes(q.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(q.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Audit Log</h1>
        <p className="text-dark/60">Catatan setiap akses & perubahan data sensitif (30 entri terbaru).</p>
      </div>

      <Card>
        <Input placeholder="Filter berdasarkan aksi, email, atau resource..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-4" />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Waktu</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Aksi</th>
                <th className="py-2 pr-4">Resource</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-dark/40">Belum ada log</td></tr>}
              {filtered.map((l) => (
                <tr key={l._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-2 pr-4 text-dark/60 whitespace-nowrap">{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                  <td className="py-2 pr-4 text-dark/70">{l.userEmail}</td>
                  <td className="py-2 pr-4"><Badge tone={toneFor(l.action)}>{l.action}</Badge></td>
                  <td className="py-2 pr-4 text-dark/60">{l.resourceType} <span className="text-dark/30">{l.resourceId?.slice(-6)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
