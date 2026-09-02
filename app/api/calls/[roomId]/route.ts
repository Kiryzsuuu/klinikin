import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { CallSession } from "@/models/CallSession";
import { ok, fail } from "@/lib/response";

type Params = { params: Promise<{ roomId: string }> };

// Signaling WebRTC lewat polling dokumen Mongo: tidak perlu provider video call
// pihak ketiga. Media stream tetap P2P langsung antar browser (via STUN publik).
export async function GET(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  await connectDB();

  let session = await CallSession.findOne({ roomId });
  if (!session) {
    session = await CallSession.create({
      roomId,
      status: "WAITING",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  }

  return ok(session);
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("offer"), offer: z.unknown() }),
  z.object({ action: z.literal("answer"), answer: z.unknown() }),
  z.object({ action: z.literal("candidate"), role: z.enum(["caller", "callee"]), candidate: z.unknown() }),
  z.object({ action: z.literal("end") }),
]);

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) return fail("VALIDATION_ERROR", "Data tidak valid", 422);

  await connectDB();
  const session = await CallSession.findOne({ roomId });
  if (!session) return fail("CALL_NOT_FOUND", "Sesi panggilan tidak ditemukan", 404);

  const data = parsed.data;
  if (data.action === "offer") {
    session.offer = data.offer;
    session.status = "ACTIVE";
  } else if (data.action === "answer") {
    session.answer = data.answer;
  } else if (data.action === "candidate") {
    if (data.role === "caller") session.callerCandidates.push(data.candidate);
    else session.calleeCandidates.push(data.candidate);
  } else if (data.action === "end") {
    session.status = "ENDED";
  }

  await session.save();
  return ok(session);
}
