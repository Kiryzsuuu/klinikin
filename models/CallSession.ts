import { Schema, model, models } from "mongoose";

// Signaling store untuk video call WebRTC peer-to-peer (telemedicine).
// Tidak butuh provider pihak ketiga: SDP offer/answer + ICE candidates
// dipertukarkan lewat dokumen ini (polling), media stream langsung P2P
// antar browser via STUN publik.
const callSessionSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    status: { type: String, enum: ["WAITING", "ACTIVE", "ENDED"], default: "WAITING" },
    offer: { type: Schema.Types.Mixed, default: null },
    answer: { type: Schema.Types.Mixed, default: null },
    callerCandidates: [{ type: Schema.Types.Mixed }],
    calleeCandidates: [{ type: Schema.Types.Mixed }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

callSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CallSession = models.CallSession || model("CallSession", callSessionSchema);
