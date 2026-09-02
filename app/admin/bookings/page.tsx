"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";

type BookingRow = {
  _id: string;
  patientName: string;
  patientPhone: string;
  complaint?: string;
  preferredDate: string;
  consultationType: string;
  status: string;
  callRoomId?: string;
  branchId?: { name: string };
  doctorId?: { name: string };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success) setBookings(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) load();
    else alert(json.error?.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Booking Pasien</h1>
        <p className="text-dark/60">Konfirmasi booking dari Patient Portal, otomatis membuat data RME saat dikonfirmasi.</p>
      </div>

      <div className="space-y-3">
        {loading && <Card><p className="text-dark/40 text-center">Memuat...</p></Card>}
        {!loading && bookings.length === 0 && <Card><p className="text-dark/40 text-center">Belum ada booking</p></Card>}
        {bookings.map((b) => (
          <Card key={b._id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-dark">{b.patientName} <span className="text-dark/40 font-normal text-sm">• {b.patientPhone}</span></p>
                <p className="text-sm text-dark/60 mt-1">{b.complaint || "Tidak ada keluhan dicantumkan"}</p>
                <p className="text-xs text-dark/50 mt-2">
                  {new Date(b.preferredDate).toLocaleString("id-ID")} • {b.branchId?.name}
                  {b.doctorId && <> • dr. {b.doctorId.name}</>}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Badge tone={b.consultationType === "ONLINE" ? "lime" : "gray"}>{b.consultationType}</Badge>
                  <Badge
                    tone={
                      b.status === "CONFIRMED" ? "green" : b.status === "REJECTED" || b.status === "CANCELLED" ? "red" : "lime"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
                {b.status === "PENDING" && (
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => updateStatus(b._id, "CONFIRMED")} className="text-green font-medium hover:underline cursor-pointer">
                      Konfirmasi
                    </button>
                    <button onClick={() => updateStatus(b._id, "REJECTED")} className="text-red-500 font-medium hover:underline cursor-pointer">
                      Tolak
                    </button>
                  </div>
                )}
                {b.status === "CONFIRMED" && b.consultationType === "ONLINE" && b.callRoomId && (
                  <Link href={`/call/${b.callRoomId}`} className="text-green text-sm font-medium hover:underline">
                    Mulai Panggilan Video
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
