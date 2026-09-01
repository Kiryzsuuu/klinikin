"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";

type Medication = { medicineName: string; dosage: string; frequency: string; duration: string };
type Referral = { isReferred: boolean; referralTo: string; reason: string };

export default function PrescriptionEditor({
  initialMeds,
  initialReferral,
  onSave,
}: {
  initialMeds: Medication[];
  initialReferral?: Referral;
  onSave: (meds: Medication[], referral: Referral) => Promise<void>;
}) {
  const [meds, setMeds] = useState<Medication[]>(initialMeds.length > 0 ? initialMeds : []);
  const [referral, setReferral] = useState<Referral>(
    initialReferral || { isReferred: false, referralTo: "", reason: "" }
  );
  const [saving, setSaving] = useState(false);

  function updateMed(i: number, patch: Partial<Medication>) {
    setMeds((arr) => arr.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(
        meds.filter((m) => m.medicineName.trim()),
        referral
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>℞ Resep</Label>
        {meds.map((m, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            <Input placeholder="Nama obat" value={m.medicineName} onChange={(e) => updateMed(i, { medicineName: e.target.value })} />
            <Input placeholder="Dosis" value={m.dosage} onChange={(e) => updateMed(i, { dosage: e.target.value })} />
            <Input placeholder="Frekuensi" value={m.frequency} onChange={(e) => updateMed(i, { frequency: e.target.value })} />
            <Input placeholder="Durasi" value={m.duration} onChange={(e) => updateMed(i, { duration: e.target.value })} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setMeds([...meds, { medicineName: "", dosage: "", frequency: "", duration: "" }])}
          className="text-green text-sm font-medium cursor-pointer"
        >
          + Tambah obat
        </button>
      </div>

      <div className="space-y-2 border-t border-dark/10 pt-3">
        <label className="flex items-center gap-2 text-sm text-dark/70">
          <input
            type="checkbox"
            checked={referral.isReferred}
            onChange={(e) => setReferral({ ...referral, isReferred: e.target.checked })}
          />
          Rujuk pasien ke fasilitas lain
        </label>
        {referral.isReferred && (
          <>
            <Input
              placeholder="Dirujuk ke (nama RS/faskes)"
              value={referral.referralTo}
              onChange={(e) => setReferral({ ...referral, referralTo: e.target.value })}
            />
            <Input
              placeholder="Alasan rujukan"
              value={referral.reason}
              onChange={(e) => setReferral({ ...referral, reason: e.target.value })}
            />
          </>
        )}
      </div>

      <Button type="button" onClick={save} disabled={saving} className="!px-3 !py-1.5 text-xs">
        {saving ? "Menyimpan..." : "Simpan Resep & Rujukan"}
      </Button>
    </div>
  );
}
