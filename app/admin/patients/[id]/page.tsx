"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, Card, Label, Select, Badge } from "@/components/ui";
import VoiceRecorder from "@/components/VoiceRecorder";
import Odontogram from "@/components/Odontogram";
import SkinChart from "@/components/SkinChart";
import PrescriptionEditor from "@/components/PrescriptionEditor";
import { fileToBase64 } from "@/lib/fileToBase64";

type Patient = { _id: string; name: string; medicalRecordNo: string; allergies?: string[]; phone?: string };
type Visit = {
  _id: string;
  visitNo: string;
  visitDate: string;
  status: string;
  subjective?: string;
  doctorId?: { name: string };
  branchId?: { name: string };
  assessment?: { diagnoses?: { icdCode: string; icdDescription: string }[] };
  objective?: { attachments?: string[] };
  plan?: {
    medications?: { medicineName: string; dosage: string; frequency: string; duration: string }[];
    referral?: { isReferred: boolean; referralTo: string; reason: string };
  };
  aiSummary?: string;
  dentalChart?: { toothNumber: number; status: string; note?: string }[];
  skinChart?: { area: string; condition: string; photoBase64?: string }[];
};
type Branch = { _id: string; name: string; code: string };
type Doctor = { _id: string; name: string; role: string };
type DiagnosisSuggestion = { icdCode: string; icdDescription: string; reasoning: string; confidence: string };

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewVisit, setShowNewVisit] = useState(false);
  const [newVisit, setNewVisit] = useState({ branchId: "", doctorId: "" });

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [subjective, setSubjective] = useState("");
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [openChart, setOpenChart] = useState<{ visitId: string; type: "dental" | "skin" } | null>(null);
  const [openRx, setOpenRx] = useState<string | null>(null);
  const [activeVisit, setActiveVisit] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const json = await res.json();
      if (json.success) {
        setPatient(json.data.patient);
        setVisits(json.data.visits);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
       
      .then((j) => j.success && setBranches(j.data));
    fetch("/api/admin/users?limit=100")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setDoctors(j.data.filter((u: Doctor) => u.role === "DOKTER"));
      });
  }, []);

  async function createVisit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newVisit, patientId: id }),
    });
    const json = await res.json();
    if (json.success) {
      setShowNewVisit(false);
      load();
    } else {
      alert(json.error?.message);
    }
  }

  async function getSummary() {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/patient-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: id }),
      });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
      else alert(json.error?.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function getSuggestions(visitId: string) {
    if (!subjective.trim()) {
      alert("Isi keluhan pasien dulu di kolom di bawah");
      return;
    }
    setAiLoading(true);
    setActiveVisit(visitId);
    try {
      const res = await fetch("/api/ai/diagnosis-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: subjective }),
      });
      const json = await res.json();
      if (json.success) setSuggestions(json.data.suggestions);
      else alert(json.error?.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function applyDiagnosis(visitId: string, s: DiagnosisSuggestion) {
    await fetch(`/api/visits/${visitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjective,
        assessment: { diagnoses: [{ icdCode: s.icdCode, icdDescription: s.icdDescription, type: "PRIMARY" }] },
      }),
    });
    setSuggestions([]);
    load();
  }

  async function saveDentalChart(visitId: string, chart: { toothNumber: number; status: string }[]) {
    await fetch(`/api/visits/${visitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dentalChart: chart }),
    });
    setOpenChart(null);
    load();
  }

  async function saveSkinChart(visitId: string, entries: { area: string; condition: string; photoBase64?: string }[]) {
    await fetch(`/api/visits/${visitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skinChart: entries }),
    });
    setOpenChart(null);
    load();
  }

  async function savePrescription(
    visitId: string,
    medications: { medicineName: string; dosage: string; frequency: string; duration: string }[],
    referral: { isReferred: boolean; referralTo: string; reason: string }
  ) {
    await fetch(`/api/visits/${visitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: { medications, referral } }),
    });
    load();
  }

  async function addAttachment(visit: Visit, file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    const attachments = [...(visit.objective?.attachments || []), base64];
    await fetch(`/api/visits/${visit._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective: { attachments } }),
    });
    load();
  }

  if (loading || !patient) return <p className="text-dark/50">Memuat...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">{patient.name}</h1>
          <p className="text-dark/60">No. RM {patient.medicalRecordNo} • {patient.phone}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={getSummary} disabled={summaryLoading}>
            {summaryLoading ? "Meringkas..." : "AI Ringkasan Riwayat"}
          </Button>
          <Button onClick={() => setShowNewVisit(true)}>+ Kunjungan Baru</Button>
        </div>
      </div>

      {summary && (
        <Card className="bg-lime/10 border-lime/40">
          <p className="text-sm font-medium text-dark mb-1">Ringkasan AI</p>
          <p className="text-sm text-dark/80">{summary}</p>
        </Card>
      )}

      <div className="space-y-4">
        {visits.length === 0 && <Card><p className="text-dark/50">Belum ada riwayat kunjungan.</p></Card>}
        {visits.map((v) => (
          <Card key={v._id}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="font-medium text-dark">{v.visitNo}</p>
                <p className="text-xs text-dark/50">
                  {new Date(v.visitDate).toLocaleDateString("id-ID")} • {v.doctorId?.name} • {v.branchId?.name}
                </p>
              </div>
              <Badge tone={v.status === "DONE" ? "green" : "lime"}>{v.status}</Badge>
            </div>

            {v.assessment?.diagnoses && v.assessment.diagnoses.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {v.assessment.diagnoses.map((d, i) => (
                  <Badge key={i} tone="gray">{d.icdCode} - {d.icdDescription}</Badge>
                ))}
              </div>
            )}

            {v.objective?.attachments && v.objective.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {v.objective.attachments.map((a, i) => (
                  <a key={i} href={a} target="_blank" rel="noreferrer">
                    <Image src={a} alt={`Lampiran ${i + 1}`} width={56} height={56} unoptimized className="rounded-lg object-cover w-14 h-14 border border-dark/10" />
                  </a>
                ))}
              </div>
            )}

            <Link
              href={`/admin/patients/${id}/visits/${v._id}/print`}
              target="_blank"
              className="inline-block px-3 py-1.5 text-xs rounded-2xl border border-dark/20 text-dark/70 hover:bg-dark/5 mb-2"
            >
              Cetak Resep/Rujukan
            </Link>

            {v.status !== "DONE" && (
              <div className="border-t border-dark/10 pt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="!mb-0">Keluhan / Subjective (SOAP)</Label>
                    <VoiceRecorder onTranscript={(text) => setSubjective((prev) => (prev ? `${prev} ${text}` : text))} />
                  </div>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
                    rows={2}
                    placeholder="Contoh: demam 2 hari, batuk berdahak, nyeri tenggorokan (atau gunakan tombol rekam suara)"
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => getSuggestions(v._id)} disabled={aiLoading}>
                    {aiLoading && activeVisit === v._id ? "Menganalisis..." : "AI Saran Diagnosis ICD-10"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenChart(openChart?.visitId === v._id && openChart.type === "dental" ? null : { visitId: v._id, type: "dental" })}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    Odontogram
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenChart(openChart?.visitId === v._id && openChart.type === "skin" ? null : { visitId: v._id, type: "skin" })}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    Skin Chart
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenRx(openRx === v._id ? null : v._id)}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    Resep & Rujukan
                  </Button>
                  <label className="px-3 py-1.5 text-xs rounded-2xl border border-dark/20 text-dark/70 hover:bg-dark/5 cursor-pointer">
                    Lampirkan Foto/Dokumen
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => addAttachment(v, e.target.files?.[0])} />
                  </label>
                </div>

                {openChart?.visitId === v._id && openChart.type === "dental" && (
                  <div className="bg-bg rounded-2xl p-4">
                    <Odontogram initial={v.dentalChart || []} onSave={(chart) => saveDentalChart(v._id, chart)} />
                  </div>
                )}
                {openChart?.visitId === v._id && openChart.type === "skin" && (
                  <div className="bg-bg rounded-2xl p-4">
                    <SkinChart initial={v.skinChart || []} onSave={(entries) => saveSkinChart(v._id, entries)} />
                  </div>
                )}
                {openRx === v._id && (
                  <div className="bg-bg rounded-2xl p-4">
                    <PrescriptionEditor
                      initialMeds={v.plan?.medications || []}
                      initialReferral={v.plan?.referral}
                      onSave={(meds, referral) => savePrescription(v._id, meds, referral)}
                    />
                  </div>
                )}

                {activeVisit === v._id && suggestions.length > 0 && (
                  <div className="space-y-2 bg-bg rounded-2xl p-4">
                    <p className="text-xs text-dark/50">Saran AI, bukan diagnosis final. Dokter tetap yang memutuskan.</p>
                    {suggestions.map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3">
                        <div>
                          <p className="font-medium text-dark text-sm">{s.icdCode} - {s.icdDescription}</p>
                          <p className="text-xs text-dark/50">{s.reasoning}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone={s.confidence === "TINGGI" ? "green" : s.confidence === "SEDANG" ? "lime" : "gray"}>
                            {s.confidence}
                          </Badge>
                          <Button type="button" onClick={() => applyDiagnosis(v._id, s)} className="!px-3 !py-1.5 text-xs">
                            Pakai
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {showNewVisit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-dark mb-4">Kunjungan Baru</h2>
            <form onSubmit={createVisit} className="space-y-4">
              <div>
                <Label>Cabang</Label>
                <Select required value={newVisit.branchId} onChange={(e) => setNewVisit({ ...newVisit, branchId: e.target.value })}>
                  <option value="">Pilih cabang</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Dokter</Label>
                <Select required value={newVisit.doctorId} onChange={(e) => setNewVisit({ ...newVisit, doctorId: e.target.value })}>
                  <option value="">Pilih dokter</option>
                  {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Buat Kunjungan</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewVisit(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
