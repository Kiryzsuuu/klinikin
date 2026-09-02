import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const settings = await getOrCreateSettings();
  return {
    title: settings.siteName || "KlinikKita",
    description: settings.description || settings.tagline || "Platform Manajemen Klinik Multi-Cabang",
    icons: settings.faviconBase64 ? { icon: settings.faviconBase64 } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-dark">{children}</body>
    </html>
  );
}
