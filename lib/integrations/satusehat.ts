// Integrasi SATUSEHAT (Kemenkes): HL7 FHIR R4.
// BUTUH kredensial resmi dari https://satusehat.kemkes.go.id (client_id/client_secret
// per organisasi terdaftar). Tanpa itu, fungsi di bawah akan melempar error yang jelas
// alih-alih diam-diam gagal.

type VisitForSync = {
  _id: string;
  visitDate: Date;
  updatedAt: Date;
  patientSatuSehatId?: string;
  doctorSatuSehatId?: string;
  branchLocationId?: string;
  diagnoses: { icdCode: string }[];
};

function requireConfig() {
  const baseUrl = process.env.SATUSEHAT_BASE_URL;
  const clientId = process.env.SATUSEHAT_CLIENT_ID;
  const clientSecret = process.env.SATUSEHAT_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error(
      "Integrasi SATUSEHAT belum dikonfigurasi. Isi SATUSEHAT_BASE_URL, SATUSEHAT_CLIENT_ID, SATUSEHAT_CLIENT_SECRET di .env.local (daftar di https://satusehat.kemkes.go.id)."
    );
  }
  return { baseUrl, clientId, clientSecret };
}

async function getAccessToken() {
  const { baseUrl, clientId, clientSecret } = requireConfig();
  const res = await fetch(`${baseUrl.replace("/fhir-r4/v1", "")}/oauth2/v1/accesstoken?grant_type=client_credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`Gagal mendapatkan token SATUSEHAT: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

function mapToFhirEncounter(visit: VisitForSync) {
  return {
    resourceType: "Encounter",
    status: "finished",
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB" },
    subject: { reference: `Patient/${visit.patientSatuSehatId}` },
    participant: visit.doctorSatuSehatId
      ? [{ individual: { reference: `Practitioner/${visit.doctorSatuSehatId}` } }]
      : [],
    period: { start: visit.visitDate.toISOString(), end: visit.updatedAt.toISOString() },
    location: visit.branchLocationId ? [{ location: { reference: `Location/${visit.branchLocationId}` } }] : [],
    diagnosis: visit.diagnoses.map((d) => ({
      condition: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: d.icdCode }] },
    })),
  };
}

export async function pushEncounter(visit: VisitForSync) {
  const { baseUrl } = requireConfig();
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl}/Encounter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(mapToFhirEncounter(visit)),
  });
  if (!res.ok) throw new Error(`SATUSEHAT menolak Encounter: ${res.status} ${await res.text()}`);
  return res.json();
}
