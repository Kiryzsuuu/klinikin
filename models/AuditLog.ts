import { Schema, model, models } from "mongoose";

// Audit log wajib (NFR §6.2 PRD): setiap akses & perubahan data medis/sensitif dicatat.
const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, default: "" },
    action: { type: String, required: true }, // contoh: "PATIENT_CREATE", "VISIT_UPDATE", "USER_DELETE"
    resourceType: { type: String, required: true }, // contoh: "Patient", "Visit", "Invoice"
    resourceId: { type: String, default: "" },
    method: { type: String, default: "" },
    path: { type: String, default: "" },
    ip: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);
