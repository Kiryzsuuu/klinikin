import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { Branch } from "@/models/Branch";
import SectionTitle from "@/components/landing/SectionTitle";

export const dynamic = "force-dynamic";

export default async function ClinicPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();

  const clinic = await Clinic.findOne({ slug, isActive: true });
  if (!clinic) notFound();

  const branches = await Branch.find({ clinicId: clinic._id, isActive: true }).select("name address contact").limit(6);

  const s = clinic.settings;
  const heroTitle = s?.hero?.title || clinic.name;
  const primary = s?.theme?.primaryColor || "#57D131";
  const secondary = s?.theme?.secondaryColor || "#9EF40B";
  const darkColor = s?.theme?.darkColor || "#406661";

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 bg-white shadow-[0px_0_18px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 lg:px-16 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {clinic.logoBase64 ? (
              <Image src={clinic.logoBase64} alt={clinic.name} width={36} height={36} unoptimized className="rounded-md w-9 h-9 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold" style={{ background: primary }}>
                {clinic.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-dark">{clinic.name}</span>
          </div>
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-dark/70">
            <Link href={`/c/${slug}/portal/login`} className="px-4 py-2 hover:text-dark">
              Portal Pasien
            </Link>
          </nav>
          <Link
            href={`/c/${slug}/booking`}
            className="px-6 py-2.5 text-white rounded-md text-sm font-semibold hover:brightness-95"
            style={{ background: primary }}
          >
            {s?.hero?.ctaText || "Booking Sekarang"}
          </Link>
        </div>
      </header>

      <section
        className="relative min-h-[70vh] flex items-end justify-center overflow-hidden"
        style={
          s?.backgroundImageBase64
            ? {
                backgroundImage: `linear-gradient(0deg, rgba(18,28,26,0.55), rgba(18,28,26,0.35)), url(${s.backgroundImageBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: `linear-gradient(135deg, ${darkColor}, ${primary})` }
        }
      >
        <div className="max-w-2xl w-full mx-6 mb-12 lg:mb-16 bg-white/95 px-8 py-10 text-center shadow-2xl" style={{ borderTop: `4px solid ${primary}` }}>
          {s?.tagline && (
            <span
              className="inline-block px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider mb-5"
              style={{ background: `${secondary}55`, color: darkColor }}
            >
              {s.tagline}
            </span>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-dark leading-tight mb-4">{heroTitle}</h1>
          {s?.description && <p className="text-dark/60 mb-2 leading-relaxed">{s.description}</p>}
          {s?.hero?.subtitle && <p className="text-dark/60 mb-7 leading-relaxed">{s.hero.subtitle}</p>}
          <Link
            href={`/c/${slug}/booking`}
            className="inline-block px-8 py-3 text-white rounded-md text-sm font-semibold tracking-wide hover:brightness-95"
            style={{ background: primary }}
          >
            {s?.hero?.ctaText || "Booking Sekarang"}
          </Link>
        </div>
      </section>

      {branches.length > 0 && (
        <section className="px-6 lg:px-16 py-20">
          <SectionTitle eyebrow="Lokasi" title="Cabang Kami" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {branches.map((b) => (
              <div key={String(b._id)} className="bg-white shadow-[0px_0_25px_rgba(0,0,0,0.08)] p-7">
                <h3 className="font-bold text-dark mb-3">{b.name}</h3>
                {b.address?.city && (
                  <p className="flex items-start gap-2 text-sm text-dark/60 mb-1.5">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} style={{ color: primary }} />
                    <span>{[b.address.street, b.address.city].filter(Boolean).join(", ")}</span>
                  </p>
                )}
                {b.contact?.phone && (
                  <p className="flex items-center gap-2 text-sm text-dark/60">
                    <Phone className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: primary }} />
                    <span>{b.contact.phone}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {s?.gallery && s.gallery.length > 0 && (
        <section className="px-6 lg:px-16 py-20 bg-white/60">
          <SectionTitle eyebrow="Info Klinik" title="Info & Promo Terbaru" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {s.gallery.map((item: { imageBase64: string; caption?: string }, i: number) => (
              <div key={i} className="bg-white shadow-[0px_0_25px_rgba(0,0,0,0.08)] overflow-hidden">
                <Image src={item.imageBase64} alt={item.caption || ""} width={400} height={260} unoptimized className="w-full aspect-video object-cover" />
                {item.caption && <p className="p-4 text-sm text-dark/70">{item.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-20 text-white text-center px-6" style={{ background: primary }}>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4">Butuh konsultasi dengan {clinic.name}</h3>
          <p className="text-white/85 mb-8">Booking jadwal Anda sekarang, tim kami akan segera menghubungi untuk konfirmasi.</p>
          <Link
            href={`/c/${slug}/booking`}
            className="inline-block px-10 py-3 border-2 border-white text-white rounded-md font-semibold tracking-wide hover:opacity-90 transition"
          >
            Booking Sekarang
          </Link>
        </div>
      </section>

      <footer className="px-6 lg:px-16 py-14 text-white" style={{ background: darkColor }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 mb-10">
          <div>
            <span className="text-lg font-bold">{clinic.name}</span>
            {s?.tagline && <p className="text-sm text-white/50 mt-2 leading-relaxed">{s.tagline}</p>}
          </div>
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: secondary }}>Kontak</p>
            <div className="space-y-1.5 text-sm text-white/60">
              {clinic.contact?.email && <p>{clinic.contact.email}</p>}
              {clinic.contact?.phone && <p>{clinic.contact.phone}</p>}
              {clinic.contact?.address && <p>{clinic.contact.address}</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: secondary }}>Tautan</p>
            <div className="space-y-1.5 text-sm text-white/60">
              <Link href={`/c/${slug}/booking`} className="block hover:text-white">Booking Konsultasi</Link>
              <Link href={`/c/${slug}/portal/login`} className="block hover:text-white">Portal Pasien</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-white/10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} {clinic.name}. Ditenagai oleh KlinikKita.
        </div>
      </footer>
    </main>
  );
}
