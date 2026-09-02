"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

type PaymentRow = {
  _id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  clinicId?: { name: string; slug: string };
  planId?: { name: string };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/payments")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPayments(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Pembayaran</h1>
        <p className="text-dark/60">Riwayat transaksi langganan seluruh klinik (via Midtrans).</p>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Klinik</th>
                <th className="py-2 pr-4">Paket</th>
                <th className="py-2 pr-4">Order ID</th>
                <th className="py-2 pr-4">Jumlah</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-6 text-center text-dark/40">Memuat...</td></tr>
              )}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-dark/40">Belum ada pembayaran</td></tr>
              )}
              {payments.map((p) => (
                <tr key={p._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-dark">{p.clinicId?.name || "-"}</td>
                  <td className="py-3 pr-4 text-dark/70">{p.planId?.name || "-"}</td>
                  <td className="py-3 pr-4 text-dark/70">{p.orderId}</td>
                  <td className="py-3 pr-4 text-dark/70">Rp {p.amount.toLocaleString("id-ID")}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={p.status === "SUCCESS" ? "green" : p.status === "PENDING" ? "lime" : "red"}>{p.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-dark/70">{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
