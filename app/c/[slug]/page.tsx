import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Clinic } from "@/models/Clinic";
import { Branch } from "@/models/Branch";

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
  const secondary = s?.theme?.secondaryColor || "#B9E937";
  const darkColor = s?.theme?.darkColor || "#406661";
  const hasBackground = Boolean(s?.backgroundImageBase64);

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-dark/5">
        <div className="flex items-center justify-between px-6 lg:px-16 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {clinic.logoBase64 ? (
              <Image src={clinic.logoBase64} alt={clinic.name} width={40} height={40} unoptimized className="rounded-2xl w-10 h-10 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: primary }}>
                {clinic.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-dark">{clinic.name}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/c/${slug}/portal/login`} className="px-3 py-2 text-sm font-medium text-dark/70 hover:text-dark">
              Portal Pasien
            </Link>
            <Link
              href={`/c/${slug}/booking`}
              className="px-5 py-2.5 text-white rounded-2xl text-sm font-semibold shadow-lg"
              style={{ background: primary }}
            >
              {s?.hero?.ctaText || "Booking Sekarang"}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative px-6 lg:px-16 pt-16 pb-24 lg:pt-24 lg:pb-32"
        style={
          hasBackground
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(18,28,26,0.78), rgba(18,28,26,0.58)), url(${s.backgroundImageBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            {s?.tagline && (
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
                style={
                  hasBackground
                    ? { background: "rgba(255,255,255,0.15)", color: "#fff" }
                    : { background: `${secondary}66`, color: darkColor }
                }
              >
                {s.tagline}
              </span>
            )}
            <h1 className={`text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 ${hasBackground ? "text-white" : "text-dark"}`}>
              {heroTitle}
            </h1>
            {s?.description && (
              <p className={`text-lg mb-3 max-w-lg leading-relaxed ${hasBackground ? "text-white/80" : "text-dark/60"}`}>{s.description}</p>
            )}
            {s?.hero?.subtitle && (
              <p className={`text-lg mb-10 max-w-lg leading-relaxed ${hasBackground ? "text-white/80" : "text-dark/60"}`}>{s.hero.subtitle}</p>
            )}
            <Link
              href={`/c/${slug}/booking`}
              className="inline-flex items-center gap-2 px-8 py-4 text-white rounded-2xl font-semibold shadow-xl hover:brightness-95"
              style={{ background: primary }}
            >
              {s?.hero?.ctaText || "Booking Sekarang"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!hasBackground && (
            <div className="relative">
              {s?.heroImageBase64 ? (
                <Image
                  src={s.heroImageBase64}
                  alt={clinic.name}
                  width={640}
                  height={520}
                  unoptimized
                  className="rounded-[2.5rem] object-cover w-full aspect-4/3 shadow-2xl"
                />
              ) : (
                <div
                  className="rounded-[2.5rem] aspect-4/3"
                  style={{ background: `linear-gradient(135deg, ${secondary}80, ${primary}50)` }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {branches.length > 0 && (
        <section className="px-6 lg:px-16 py-16">
          <div className="text-center mb-12 max-w-xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: primary }}>Lokasi</p>
            <h2 className="text-3xl font-extrabold text-dark">Cabang Kami</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {branches.map((b) => (
              <div key={String(b._id)} className="bg-white rounded-3xl p-7 shadow-sm border border-dark/5">
                <h3 className="font-bold text-dark mb-3">{b.name}</h3>
                {b.address?.city && (
                  <p className="flex items-start gap-2 text-sm text-dark/60 mb-1.5">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
                    <span>{[b.address.street, b.address.city].filter(Boolean).join(", ")}</span>
                  </p>
                )}
                {b.contact?.phone && (
                  <p className="flex items-center gap-2 text-sm text-dark/60">
                    <Phone className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>{b.contact.phone}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {s?.gallery && s.gallery.length > 0 && (
        <section className="px-6 lg:px-16 py-16 bg-white/60">
          <div className="text-center mb-12 max-w-xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: primary }}>Info Klinik</p>
            <h2 className="text-3xl font-extrabold text-dark">Info & Promo Terbaru</h2>
          </div>
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

      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] px-8 py-14 lg:px-16 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-8 text-white" style={{ background: darkColor }}>
          <div className="max-w-lg text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-extrabold mb-3">Butuh konsultasi dengan {clinic.name}</h2>
            <p className="text-white/70">Booking jadwal Anda sekarang, tim kami akan segera menghubungi untuk konfirmasi.</p>
          </div>
          <Link
            href={`/c/${slug}/booking`}
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold shadow-xl hover:brightness-95"
            style={{ background: secondary, color: darkColor }}
          >
            Booking Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="px-6 lg:px-16 py-12 border-t border-dark/10">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 mb-10">
          <div>
            <span className="text-lg font-bold text-dark">{clinic.name}</span>
            {s?.tagline && <p className="text-sm text-dark/50 mt-2 leading-relaxed">{s.tagline}</p>}
          </div>
          <div>
            <p className="text-sm font-semibold text-dark mb-3">Kontak</p>
            <div className="space-y-1.5 text-sm text-dark/60">
              {clinic.contact?.email && <p>{clinic.contact.email}</p>}
              {clinic.contact?.phone && <p>{clinic.contact.phone}</p>}
              {clinic.contact?.address && <p>{clinic.contact.address}</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-dark mb-3">Tautan</p>
            <div className="space-y-1.5 text-sm text-dark/60">
              <Link href={`/c/${slug}/booking`} className="block hover:text-dark">Booking Konsultasi</Link>
              <Link href={`/c/${slug}/portal/login`} className="block hover:text-dark">Portal Pasien</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-dark/10 text-sm text-dark/40">
          &copy; {new Date().getFullYear()} {clinic.name}. Ditenagai oleh KlinikKita.
        </div>
      </footer>
    </main>
  );
}
