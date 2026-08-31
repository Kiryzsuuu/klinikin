"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

export default function RevenueForecast() {
  const [forecast, setForecast] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/revenue-forecast", { method: "POST" });
      const json = await res.json();
      if (json.success) setForecast(json.data.forecast);
      else alert(json.error?.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-dark">✨ AI Revenue Forecast</h2>
        <Button variant="secondary" onClick={run} disabled={loading} className="!px-3 !py-1.5 text-sm">
          {loading ? "Menganalisis..." : "Buat Analisis"}
        </Button>
      </div>
      {forecast ? (
        <p className="text-sm text-dark/80">{forecast}</p>
      ) : (
        <p className="text-sm text-dark/40">Klik tombol untuk membuat analisis tren pendapatan 6 bulan terakhir.</p>
      )}
    </Card>
  );
}
