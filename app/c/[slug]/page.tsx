import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";

export const dynamic = "force-dynamic";

export default async function ClinicPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();

  const clinic = await Clinic.findOne({ slug, isActive: true });
  if (!clinic) notFound();

  const s = clinic.settings;
  const heroTitle = s?.hero?.title || clinic.name;

  return (
    <main className="flex-1">
      <header className="flex items-center justify-between px-6 lg:px-16 py-6">
        <div className="flex items-center gap-3">
          {clinic.logoBase64 ? (
            <Image src={clinic.logoBase64} alt={clinic.name} width={36} height={36} unoptimized className="rounded-xl w-9 h-9 object-cover" />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: s?.theme?.primaryColor || "#57D131" }}
            >
              {clinic.name.charAt(0)}
            </div>
          )}
          <span className="text-lg font-semibold text-dark">{clinic.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/c/${slug}/portal/login`} className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Portal Pasien
          </Link>
          <Link
            href={`/c/${slug}/booking`}
            className="px-5 py-2 text-white rounded-2xl text-sm font-medium shadow-md"
            style={{ background: s?.theme?.primaryColor || "#57D131" }}
          >
            {s?.hero?.ctaText || "Booking Sekarang"}
          </Link>
        </div>
      </header>

      <section className="px-6 lg:px-16 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          {s?.tagline && (
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{ background: `${s.theme?.secondaryColor || "#B9E937"}66`, color: s.theme?.darkColor || "#406661" }}
            >
              {s.tagline}
            </span>
          )}
          <h1 className="text-4xl lg:text-5xl font-semibold text-dark leading-tight mb-6">{heroTitle}</h1>
          {s?.description && <p className="text-dark/60 text-lg mb-4 max-w-lg">{s.description}</p>}
          {s?.hero?.subtitle && <p className="text-dark/60 text-lg mb-8 max-w-lg">{s.hero.subtitle}</p>}
          <Link
            href={`/c/${slug}/booking`}
            className="inline-block px-7 py-3.5 text-white rounded-2xl font-medium shadow-lg hover:brightness-95"
            style={{ background: s?.theme?.primaryColor || "#57D131" }}
          >
            {s?.hero?.ctaText || "Booking Sekarang"}
          </Link>
        </div>

        <div className="relative">
          {s?.heroImageBase64 ? (
            <Image
              src={s.heroImageBase64}
              alt={clinic.name}
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

      {s?.gallery && s.gallery.length > 0 && (
        <section className="px-6 lg:px-16 py-16 bg-white/60">
          <h2 className="text-2xl font-semibold text-dark mb-8 text-center">Info & Promo Terbaru</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {s.gallery.map((item: { imageBase64: string; caption?: string }, i: number) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-dark/5">
                <Image src={item.imageBase64} alt={item.caption || ""} width={400} height={260} unoptimized className="w-full aspect-video object-cover" />
                {item.caption && <p className="p-4 text-sm text-dark/70">{item.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="px-6 lg:px-16 py-10 border-t border-dark/10 flex flex-wrap items-center justify-between gap-4 text-sm text-dark/50">
        <span>&copy; {new Date().getFullYear()} {clinic.name}</span>
        <div className="flex gap-4">
          {clinic.contact?.email && <span>{clinic.contact.email}</span>}
          {clinic.contact?.phone && <span>{clinic.contact.phone}</span>}
        </div>
      </footer>
    </main>
  );
}
