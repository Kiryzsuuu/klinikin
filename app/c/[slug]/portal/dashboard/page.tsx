"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";

type PatientMe = { name: string; medicalRecordNo: string; allergies?: string[] };
type Visit = {
  _id: string;
  visitNo: string;
  visitDate: string;
  status: string;
  subjective?: string;
  doctorId?: { name: string };
  branchId?: { name: string };
  assessment?: { diagnoses?: { icdCode: string; icdDescription: string }[] };
  plan?: { medications?: { medicineName: string; dosage: string; frequency: string }[]; controlDate?: string };
};
type LabOrder = { _id: string; testName: string; status: string; resultText?: string; createdAt: string };

export default function PortalDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<PatientMe | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patient-auth/me")
      .then((r) => r.json())

      .then((json) => {
        if (!json.success) {
          router.push(`/c/${slug}/portal/login`);
          return;
        }
        setPatient(json.data.patient);
        setVisits(json.data.visits);
        setLabOrders(json.data.labOrders);
      })
      .finally(() => setLoading(false));
  }, [router, slug]);

  async function logout() {
    await fetch("/api/patient-auth/logout", { method: "POST" });
    router.push(`/c/${slug}/portal/login`);
  }

  if (loading || !patient) return <main className="flex-1 flex items-center justify-center"><p className="text-dark/50">Memuat...</p></main>;

  return (
    <main className="flex-1 p-6 lg:p-10 max-w-3xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Halo, {patient.name}</h1>
          <p className="text-dark/60">No. RM {patient.medicalRecordNo}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/c/${slug}/booking`}><Button variant="secondary">+ Booking Baru</Button></Link>
          <Button variant="ghost" onClick={logout}>Keluar</Button>
        </div>
      </div>

      {patient.allergies && patient.allergies.length > 0 && (
        <Card className="bg-red-50 border-red-100">
          <p className="text-sm font-medium text-red-600">⚠️ Alergi tercatat: {patient.allergies.join(", ")}</p>
        </Card>
      )}

      <div>
        <h2 className="font-semibold text-dark mb-3">Riwayat Kunjungan</h2>
        <div className="space-y-3">
          {visits.length === 0 && <Card><p className="text-dark/40">Belum ada riwayat kunjungan.</p></Card>}
          {visits.map((v) => (
            <Card key={v._id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-dark/50">{new Date(v.visitDate).toLocaleDateString("id-ID")} • {v.branchId?.name} • dr. {v.doctorId?.name}</p>
                <Badge tone={v.status === "DONE" ? "green" : "lime"}>{v.status}</Badge>
              </div>
              {v.subjective && <p className="text-sm text-dark mb-1"><b>Keluhan:</b> {v.subjective}</p>}
              {v.assessment?.diagnoses && v.assessment.diagnoses.length > 0 && (
                <p className="text-sm text-dark mb-1"><b>Diagnosis:</b> {v.assessment.diagnoses.map((d) => d.icdDescription).join(", ")}</p>
              )}
              {v.plan?.medications && v.plan.medications.length > 0 && (
                <p className="text-sm text-dark"><b>Obat:</b> {v.plan.medications.map((m) => `${m.medicineName} (${m.dosage})`).join(", ")}</p>
              )}
              {v.plan?.controlDate && (
                <p className="text-xs text-dark/50 mt-1">Jadwal kontrol: {new Date(v.plan.controlDate).toLocaleDateString("id-ID")}</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-dark mb-3">Hasil Lab / Radiologi</h2>
        <div className="space-y-3">
          {labOrders.length === 0 && <Card><p className="text-dark/40">Belum ada hasil lab.</p></Card>}
          {labOrders.map((l) => (
            <Card key={l._id}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-dark">{l.testName}</p>
                <Badge tone={l.status === "DONE" ? "green" : "lime"}>{l.status}</Badge>
              </div>
              <p className="text-xs text-dark/50 mb-1">{new Date(l.createdAt).toLocaleDateString("id-ID")}</p>
              {l.resultText && <p className="text-sm text-dark">{l.resultText}</p>}
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
