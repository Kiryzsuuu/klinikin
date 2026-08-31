import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId).select("-passwordHash");
  if (!user) redirect("/login");

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        photoBase64: user.photoBase64,
      }}
    >
      {children}
    </AdminShell>
  );
}
