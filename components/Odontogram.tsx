"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Tooth = { toothNumber: number; status: string; note?: string };

const STATUS_CYCLE = ["SEHAT", "KARIES", "TAMBAL", "DICABUT", "AKAR", "IMPAKSI"];
const STATUS_COLOR: Record<string, string> = {
  SEHAT: "bg-white text-dark/40 border-dark/15",
  KARIES: "bg-red-100 text-red-600 border-red-200",
  TAMBAL: "bg-lime/40 text-dark border-lime",
  DICABUT: "bg-dark/10 text-dark/40 border-dark/20 line-through",
  AKAR: "bg-orange-100 text-orange-600 border-orange-200",
  IMPAKSI: "bg-purple-100 text-purple-600 border-purple-200",
};

// Odontogram sederhana: 32 gigi permanen, klik untuk siklus status.
export default function Odontogram({
  initial,
  onSave,
}: {
  initial: Tooth[];
  onSave: (chart: Tooth[]) => Promise<void>;
}) {
  const [chart, setChart] = useState<Tooth[]>(() => {
    const map = new Map(initial.map((t) => [t.toothNumber, t.status]));
    return Array.from({ length: 32 }, (_, i) => ({ toothNumber: i + 1, status: map.get(i + 1) || "SEHAT" }));
  });
  const [saving, setSaving] = useState(false);

  function cycle(toothNumber: number) {
    setChart((prev) =>
      prev.map((t) => {
        if (t.toothNumber !== toothNumber) return t;
        const nextIndex = (STATUS_CYCLE.indexOf(t.status) + 1) % STATUS_CYCLE.length;
        return { ...t, status: STATUS_CYCLE[nextIndex] };
      })
    );
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(chart.filter((t) => t.status !== "SEHAT"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-dark/50">Klik tiap gigi untuk mengubah status secara berurutan: {STATUS_CYCLE.join(", ")}.</p>
      <div className="grid grid-cols-8 gap-1.5">
        {chart.map((t) => (
          <button
            key={t.toothNumber}
            type="button"
            onClick={() => cycle(t.toothNumber)}
            className={`aspect-square rounded-lg border text-[10px] font-semibold flex items-center justify-center cursor-pointer ${STATUS_COLOR[t.status]}`}
            title={`Gigi ${t.toothNumber}: ${t.status}`}
          >
            {t.toothNumber}
          </button>
        ))}
      </div>
      <Button type="button" onClick={save} disabled={saving} className="!px-3 !py-1.5 text-xs">
        {saving ? "Menyimpan..." : "Simpan Odontogram"}
      </Button>
    </div>
  );
}
