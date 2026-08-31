import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Branch } from "@/models/Branch";
import { Patient, generateMedicalRecordNo } from "@/models/Patient";
import { Visit, generateVisitNo } from "@/models/Visit";
import { guard, isError, CLINICAL_ROLES } from "@/lib/guard";
import { ok, fail } from "@/lib/response";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED", "COMPLETED", "CANCELLED"]),
});

type Params = { params: Promise<{ id: string }> };

// Konfirmasi booking -> otomatis buat/temukan pasien + buat Visit (menyambung ke RME)
export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard(CLINICAL_ROLES);
  if (isError(g)) return g.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) return fail("BOOKING_NOT_FOUND", "Booking tidak ditemukan", 404);

  booking.status = parsed.data.status;

  if (parsed.data.status === "CONFIRMED" && !booking.visitId) {
    const branch = await Branch.findById(booking.branchId);
    if (!branch) return fail("BRANCH_NOT_FOUND", "Cabang tidak ditemukan", 404);

    let patient = await Patient.findOne({ phone: booking.patientPhone, name: booking.patientName });
    if (!patient) {
      patient = await Patient.create({
        medicalRecordNo: await generateMedicalRecordNo(),
        registeredBranchId: booking.branchId,
        name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail,
      });
    }

    if (booking.doctorId) {
      const visitNo = await generateVisitNo(branch.code);
      const visit = await Visit.create({
        branchId: booking.branchId,
        patientId: patient._id,
        doctorId: booking.doctorId,
        visitNo,
        subjective: booking.complaint,
      });
      booking.visitId = visit._id;
    }
  }

  await booking.save();
  return ok(booking);
}
