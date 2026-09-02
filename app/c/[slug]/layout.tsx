import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";

export default async function ClinicPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const clinic = await Clinic.findOne({ slug, isActive: true });
  if (!clinic) notFound();

  return <>{children}</>;
}
