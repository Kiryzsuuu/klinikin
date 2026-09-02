import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";
import { CASHIER_ROLES } from "@/lib/guard";
import { scopedGuard, isError } from "@/lib/tenant";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const g = await scopedGuard(CASHIER_ROLES);
  if (isError(g)) return g.error;
  const { clinicFilter } = g;

  await connectDB();
  const invoices = await Invoice.find({ ...clinicFilter })
    .populate("patientId", "name")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  const csv = toCsv(
    invoices.map((inv) => ({
      invoiceNo: inv.invoiceNo,
      patient: (inv.patientId as unknown as { name?: string })?.name || "",
      branch: (inv.branchId as unknown as { name?: string })?.name || "",
      total: inv.total,
      status: inv.payment.status,
      method: inv.payment.method,
      createdAt: inv.createdAt.toISOString().slice(0, 10),
    })),
    [
      { key: "invoiceNo", header: "No. Invoice" },
      { key: "patient", header: "Pasien" },
      { key: "branch", header: "Cabang" },
      { key: "total", header: "Total" },
      { key: "status", header: "Status Bayar" },
      { key: "method", header: "Metode" },
      { key: "createdAt", header: "Tanggal" },
    ]
  );

  return csvResponse(csv, `invoice-${new Date().toISOString().slice(0, 10)}.csv`);
}
