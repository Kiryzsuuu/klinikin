import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import PortalLoginForm from "@/components/PortalLoginForm";

export const dynamic = "force-dynamic";

export default async function PortalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();

  const clinic = await Clinic.findOne({ slug, isActive: true });
  if (!clinic) notFound();

  return (
    <AuthSplitLayout
      imageBase64={clinic.settings?.loginImageBase64}
      siteName={clinic.name}
      tagline={clinic.settings?.tagline}
    >
      <PortalLoginForm slug={slug} />
    </AuthSplitLayout>
  );
}
