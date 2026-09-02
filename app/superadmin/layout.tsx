import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import SuperAdminShell from "./SuperAdminShell";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  await connectDB();
  const user = await User.findById(session.userId).select("-passwordHash");
  if (!user) redirect("/login");

  return (
    <SuperAdminShell user={{ name: user.name, email: user.email }}>{children}</SuperAdminShell>
  );
}
