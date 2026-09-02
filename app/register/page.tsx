import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import RegisterForm from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  await connectDB();
  const settings = await getOrCreateSettings();

  return (
    <AuthSplitLayout imageBase64={settings.loginImageBase64} siteName={settings.siteName} tagline={settings.tagline}>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
