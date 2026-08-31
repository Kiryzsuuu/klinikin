import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";

// Selalu render dinamis: konten diambil dari Site Settings di DB, tidak boleh di-cache saat build.
export const dynamic = "force-dynamic";

export default async function Home() {
  await connectDB();
  const settings = await getOrCreateSettings();

  if (settings.features?.maintenanceMode) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-dark mb-2">{settings.siteName}</h1>
          <p className="text-dark/60 max-w-md">{settings.features.maintenanceMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between px-6 lg:px-16 py-6">
        <div className="flex items-center gap-3">
          {settings.logoBase64 ? (
            <Image src={settings.logoBase64} alt={settings.siteName} width={36} height={36} unoptimized className="rounded-xl w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-green flex items-center justify-center text-white font-bold">
              {settings.siteName?.charAt(0) || "K"}
            </div>
          )}
          <span className="text-lg font-semibold text-dark">{settings.siteName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/booking" className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Booking Konsultasi
          </Link>
          <Link href="/portal/login" className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Portal Pasien
          </Link>
          <Link href="/login" className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Masuk Staf
          </Link>
          {settings.features?.registrationEnabled && (
            <Link href="/register" className="px-5 py-2 bg-green text-white rounded-2xl text-sm font-medium shadow-md shadow-green/30">
              Daftar
            </Link>
          )}
        </div>
      </header>

      <section className="px-6 lg:px-16 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-lime/40 text-dark px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            {settings.tagline}
          </span>
          <h1 className="text-4xl lg:text-5xl font-semibold text-dark leading-tight mb-6">
            {settings.hero.title}
          </h1>
          <p className="text-dark/60 text-lg mb-8 max-w-lg">{settings.hero.subtitle}</p>
          <Link
            href={settings.hero.ctaLink}
            className="inline-block px-7 py-3.5 bg-green text-white rounded-2xl font-medium shadow-lg shadow-green/30 hover:brightness-95"
          >
            {settings.hero.ctaText}
          </Link>
        </div>

        <div className="relative">
          {settings.heroImageBase64 ? (
            <Image
              src={settings.heroImageBase64}
              alt="Hero"
              width={560}
              height={420}
              unoptimized
              className="rounded-3xl object-cover w-full shadow-xl"
            />
          ) : (
            <div className="rounded-3xl bg-linear-to-br from-lime/50 to-green/40 aspect-4/3 flex items-center justify-center">
              <span className="text-6xl">🏥</span>
            </div>
          )}
        </div>
      </section>

      <footer className="px-6 lg:px-16 py-10 border-t border-dark/10 flex flex-wrap items-center justify-between gap-4 text-sm text-dark/50">
        <span>
          &copy; {new Date().getFullYear()} {settings.siteName}. Semua hak dilindungi.
        </span>
        <div className="flex gap-4">
          {settings.contact?.email && <span>{settings.contact.email}</span>}
          {settings.contact?.phone && <span>{settings.contact.phone}</span>}
        </div>
      </footer>
    </main>
  );
}
