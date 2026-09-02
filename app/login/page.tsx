import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import AuthSplitLayout from "@/components/AuthSplitLayout";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await connectDB();
  const settings = await getOrCreateSettings();

  return (
    <AuthSplitLayout imageBase64={settings.loginImageBase64} siteName={settings.siteName} tagline={settings.tagline}>
      <LoginForm siteName={settings.siteName} />
    </AuthSplitLayout>
  );
}
