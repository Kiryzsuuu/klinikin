"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Input } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

type SkinEntry = { area: string; condition: string; photoBase64?: string };

// Skin chart sederhana untuk klinik kecantikan: daftar area + kondisi + foto.
export default function SkinChart({ initial, onSave }: { initial: SkinEntry[]; onSave: (entries: SkinEntry[]) => Promise<void> }) {
  const [entries, setEntries] = useState<SkinEntry[]>(initial.length > 0 ? initial : [{ area: "", condition: "" }]);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<SkinEntry>) {
    setEntries((arr) => arr.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function onPhoto(i: number, file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    update(i, { photoBase64: base64 });
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(entries.filter((e) => e.area.trim()));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-2 bg-bg rounded-xl p-3">
          {e.photoBase64 ? (
            <Image src={e.photoBase64} alt={e.area} width={40} height={40} unoptimized className="rounded-lg object-cover w-10 h-10 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white border border-dark/10 shrink-0" />
          )}
          <div className="flex-1 space-y-1.5">
            <Input placeholder="Area kulit (mis. Pipi kiri)" value={e.area} onChange={(ev) => update(i, { area: ev.target.value })} />
            <Input placeholder="Kondisi (mis. Jerawat inflamasi ringan)" value={e.condition} onChange={(ev) => update(i, { condition: ev.target.value })} />
            <input type="file" accept="image/*" onChange={(ev) => onPhoto(i, ev.target.files?.[0])} className="text-xs" />
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={() => setEntries([...entries, { area: "", condition: "" }])} className="text-green text-sm font-medium cursor-pointer">
          + Tambah area
        </button>
        <Button type="button" onClick={save} disabled={saving} className="!px-3 !py-1.5 text-xs ml-auto">
          {saving ? "Menyimpan..." : "Simpan Skin Chart"}
        </Button>
      </div>
    </div>
  );
}
