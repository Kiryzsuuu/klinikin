import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Clinic } from "@/models/Clinic";
import { getSession } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "SUPER_ADMIN") redirect("/superadmin");

  await connectDB();
  const [user, clinic] = await Promise.all([
    User.findById(session.userId).select("-passwordHash"),
    session.clinicId ? Clinic.findById(session.clinicId) : null,
  ]);
  if (!user) redirect("/login");

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        photoBase64: user.photoBase64,
      }}
      clinic={
        clinic
          ? {
              name: clinic.name,
              status: clinic.subscription?.status ?? "TRIAL",
              trialEndsAt: clinic.subscription?.trialEndsAt ? String(clinic.subscription.trialEndsAt) : null,
            }
          : null
      }
    >
      {children}
    </AdminShell>
  );
}
