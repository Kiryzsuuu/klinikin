import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Branch } from "@/models/Branch";
import { Patient, generateMedicalRecordNo } from "@/models/Patient";
import { Visit, generateVisitNo } from "@/models/Visit";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"]),
});

type Params = { params: Promise<{ id: string }> };

// Konfirmasi booking -> otomatis buat/temukan pasien + buat Visit (menyambung ke RME)
export async function PUT(req: NextRequest, { params }: Params) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { session, clinicFilter } = g;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const booking = await Booking.findOne({ _id: id, ...clinicFilter });
  if (!booking) return fail("BOOKING_NOT_FOUND", "Booking tidak ditemukan", 404);

  booking.status = parsed.data.status;

  if (parsed.data.status === "CONFIRMED" && !booking.visitId) {
    if (!session.clinicId) return fail("CLINIC_REQUIRED", "Akun ini tidak terhubung ke klinik", 400);

    const branch = await Branch.findOne({ _id: booking.branchId, ...clinicFilter });
    if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);

    let patient = booking.patientId
      ? await Patient.findOne({ _id: booking.patientId, ...clinicFilter })
      : await Patient.findOne({ phone: booking.patientPhone, name: booking.patientName, ...clinicFilter });
    if (!patient) {
      patient = await Patient.create({
        medicalRecordNo: await generateMedicalRecordNo(session.clinicId),
        registeredBranchId: booking.branchId,
        name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail,
        clinicId: session.clinicId,
      });
    }

    if (booking.doctorId) {
      const visitNo = await generateVisitNo(session.clinicId, branch.code);
      const visit = await Visit.create({
        branchId: booking.branchId,
        patientId: patient._id,
        doctorId: booking.doctorId,
        visitNo,
        subjective: booking.complaint,
        clinicId: session.clinicId,
      });
      booking.visitId = visit._id;
    }
  }

  await booking.save();
  return ok(booking);
}
