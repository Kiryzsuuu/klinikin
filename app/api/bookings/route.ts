import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { sendMail } from "@/lib/mailer";
import { getPatientSession } from "@/lib/patientAuth";
import { CLINICAL_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { ok, fail } from "@/lib/response";

const createSchema = z.object({
  clinicId: z.string(),
  branchId: z.string(),
  doctorId: z.string().optional(),
  patientName: z.string().min(2),
  patientPhone: z.string().min(6),
  patientEmail: z.string().email().optional().or(z.literal("")),
  complaint: z.string().optional(),
  preferredDate: z.string(),
  consultationType: z.enum(["ONSITE", "ONLINE"]).optional(),
});

// Publik: form booking di landing/patient portal, tanpa perlu akun/login pasien
export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422, parsed.error.flatten());

  await connectDB();

  const data = parsed.data;
  const callRoomId = data.consultationType === "ONLINE" ? crypto.randomUUID() : "";
  const patientSession = await getPatientSession();

  const booking = await Booking.create({
    ...data,
    callRoomId,
    patientId: patientSession?.patientId,
  });

  if (data.patientEmail) {
    try {
      await sendMail(
        data.patientEmail,
        "Booking Diterima - KlinikKita",
        `<p>Halo ${data.patientName},</p><p>Permintaan booking Anda telah kami terima dan akan segera dikonfirmasi oleh admin klinik.</p>`
      );
    } catch {
      // jangan gagalkan booking hanya karena email gagal terkirim
    }
  }

  return ok(booking, { status: 201 });
}

// Admin: daftar booking untuk dikonfirmasi/dikelola
export async function GET(req: NextRequest) {
  const g = await scopedGuard(CLINICAL_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");

  const filter: Record<string, unknown> = { ...clinicFilter };
  if (status) filter.status = status;
  if (branchId) filter.branchId = branchId;

  const bookings = await Booking.find(filter)
    .populate("branchId", "name code")
    .populate("doctorId", "name")
    .sort({ preferredDate: 1 });

  return ok(bookings);
}
