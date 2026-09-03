import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope,
  Pill,
  Receipt,
  CalendarCheck,
  Sparkles,
  Users,
  Clock,
  Building2,
  ShieldCheck,
  Check,
  ClipboardCheck,
  HeartHandshake,
  Lock,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";
import SectionTitle from "@/components/landing/SectionTitle";
import Faq from "@/components/landing/Faq";
import { FEATURE_LABELS } from "@/lib/features";

export const dynamic = "force-dynamic";

type Plan = {
  _id: string;
  name: string;
  priceMonthly: number;
  maxBranches: number;
  maxUsers: number;
  features: string[];
};

const HIGHLIGHTS = [
  { icon: Stethoscope, title: "RME Lengkap", desc: "Rekam medis elektronik dengan odontogram, skin chart, dan rujukan digital." },
  { icon: Pill, title: "Farmasi & Stok", desc: "Kelola stok obat multi-cabang, batch, dan transfer antar cabang secara real-time." },
  { icon: Receipt, title: "Kasir & Invoice", desc: "Penagihan cepat untuk pasien umum, BPJS, maupun asuransi swasta." },
  { icon: CalendarCheck, title: "Booking Online", desc: "Pasien bisa booking konsultasi lewat portal khusus klinik Anda, kapan saja." },
];

const WHY_LIST = [
  { icon: ClipboardCheck, title: "Semua Tercatat Rapi", desc: "Dari pendaftaran pasien sampai laporan keuangan bulanan, tidak ada lagi catatan tercecer." },
  { icon: HeartHandshake, title: "Dipakai Tim Anda Sendiri", desc: "Dokter, perawat, apoteker, dan kasir punya akses sesuai peran masing-masing." },
  { icon: Lock, title: "Data Klinik Terisolasi", desc: "Setiap klinik memiliki data terpisah sepenuhnya, tidak tercampur dengan klinik lain." },
  { icon: Sparkles, title: "Dibantu Asisten AI", desc: "Ringkasan rekam medis, saran diagnosis, dan prediksi stok otomatis." },
];

const STATS = [
  { icon: Clock, value: "14 Hari", label: "Masa trial gratis" },
  { icon: Building2, value: "Tanpa Batas", label: "Cabang di paket Enterprise" },
  { icon: CalendarCheck, value: "24/7", label: "Booking online untuk pasien" },
  { icon: ShieldCheck, value: "MFA", label: "Keamanan akun staf" },
];

export default async function Home() {
  await connectDB();
  const [settingsDoc, plansDocs] = await Promise.all([
    getOrCreateSettings(),
    SubscriptionPlan.find({ isActive: true }).sort({ priceMonthly: 1 }),
  ]);
  // Serialisasi ke plain object: dokumen Mongoose punya referensi internal (parent,
  // schema) yang bikin serializer React Server Components stack overflow kalau dilempar
  // langsung ke Client Component (Faq di bawah menerima settings.faqs).
  const settings = JSON.parse(JSON.stringify(settingsDoc));
  const plans: Plan[] = JSON.parse(JSON.stringify(plansDocs));

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

  const theme = settings.theme || {};
  const sectionColors = theme.sections || {};
  const colorVar = (color?: string): CSSProperties =>
    color ? ({ "--color-dark": color } as CSSProperties) : {};

  return (
    <main
      className="flex-1"
      style={
        {
          "--color-green": theme.primaryColor || "#1B686B",
          "--color-lime": theme.secondaryColor || "#1B686B",
          "--color-dark": theme.darkColor || "#406661",
        } as CSSProperties
      }
    >
      <header className="sticky top-0 z-30 bg-white shadow-[0px_0_18px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 lg:px-16 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {settings.logoBase64 ? (
              <Image src={settings.logoBase64} alt={settings.siteName} width={36} height={36} unoptimized className="rounded-md w-9 h-9 object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-md bg-green flex items-center justify-center text-white font-bold">
                {settings.siteName?.charAt(0) || "K"}
              </div>
            )}
            <span className="text-lg font-bold text-dark">{settings.siteName}</span>
          </div>
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-dark/70">
            <Link href="#fitur" className="px-4 py-2 hover:text-green">Fitur</Link>
            <Link href="#harga" className="px-4 py-2 hover:text-green">Harga</Link>
            <Link href="#faq" className="px-4 py-2 hover:text-green">FAQ</Link>
            <Link href="/login" className="px-4 py-2 hover:text-green">Masuk</Link>
          </nav>
          {settings.features?.registrationEnabled && (
            <Link href="/register" className="px-6 py-2.5 bg-green text-white rounded-md text-sm font-semibold hover:brightness-95">
              Daftarkan Klinik
            </Link>
          )}
        </div>
      </header>

      <section
        className="relative min-h-[70vh] flex items-end justify-center overflow-hidden"
        style={
          settings.backgroundImageBase64
            ? {
                backgroundImage: `linear-gradient(0deg, rgba(18,28,26,0.55), rgba(18,28,26,0.35)), url(${settings.backgroundImageBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, var(--color-dark), var(--color-green))" }
        }
      >
        <div
          className="max-w-2xl w-full mx-6 mb-12 lg:mb-16 bg-white/95 border-t-4 border-green px-8 py-10 text-center shadow-2xl"
          style={colorVar(sectionColors.hero)}
        >
          <span className="inline-block px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider mb-5 bg-lime/40 text-dark">
            {settings.tagline}
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-dark leading-tight mb-4">{settings.hero.title}</h1>
          <p className="text-dark/60 mb-7 leading-relaxed">{settings.hero.subtitle}</p>
          <Link
            href={settings.hero.ctaLink}
            className="inline-block px-8 py-3 bg-green text-white rounded-md text-sm font-semibold tracking-wide hover:brightness-95"
          >
            {settings.hero.ctaText}
          </Link>
        </div>
      </section>

      <section id="fitur" className="relative px-6 lg:px-16 -mt-16 z-10" style={colorVar(sectionColors.features)}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-dark/5 max-w-6xl mx-auto shadow-[0px_0_25px_rgba(0,0,0,0.1)]">
          {HIGHLIGHTS.map((f) => (
            <div key={f.title} className="bg-white p-8 text-center">
              <f.icon className="w-9 h-9 text-green mx-auto mb-4" strokeWidth={1.5} />
              <h4 className="font-bold text-dark mb-3">{f.title}</h4>
              <p className="text-sm text-dark/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 py-20 bg-green text-white text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4">Siap memindahkan klinik Anda ke sistem digital</h3>
          <p className="text-white/85 mb-8">Trial 14 hari penuh fitur inti, tanpa kartu kredit, dan bisa upgrade kapan saja.</p>
          <Link
            href="/register"
            className="inline-block px-10 py-3 border-2 border-white text-white rounded-md font-semibold tracking-wide hover:bg-white hover:text-green transition"
          >
            Daftarkan Klinik Gratis
          </Link>
        </div>
      </section>

      <section className="px-6 lg:px-16 py-20" style={colorVar(sectionColors.whyUs)}>
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="relative min-h-[360px]">
            {settings.heroImageBase64 ? (
              <Image src={settings.heroImageBase64} alt="Ilustrasi platform" fill unoptimized className="object-cover rounded-sm" />
            ) : (
              <div className="absolute inset-0 rounded-sm bg-linear-to-br from-dark to-green" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-dark mb-3 pb-4 relative inline-block">
              Dibangun khusus untuk operasional klinik Indonesia
              <span className="absolute bottom-0 left-0 w-12 h-[3px] bg-green" />
            </h3>
            <p className="text-dark/60 mb-8 leading-relaxed">
              Satu sistem untuk seluruh alur kerja klinik Anda, mudah dipakai tim non-teknis sekalipun.
            </p>
            <div className="space-y-6">
              {WHY_LIST.map((f) => (
                <div key={f.title} className="flex gap-5">
                  <div className="w-14 h-14 rounded-sm bg-white shadow-[0px_2px_30px_rgba(0,0,0,0.1)] text-green flex items-center justify-center shrink-0">
                    <f.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark mb-1">{f.title}</h4>
                    <p className="text-sm text-dark/60 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-16 py-16" style={colorVar(sectionColors.stats)}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white shadow-[0px_0_30px_rgba(0,0,0,0.08)] p-7 flex items-center gap-5">
              <s.icon className="w-10 h-10 text-green shrink-0" strokeWidth={1.5} />
              <div>
                <span className="block text-2xl font-bold text-dark">{s.value}</span>
                <p className="text-sm text-dark/60">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="harga" className="px-6 lg:px-16 py-20 bg-white/60" style={colorVar(sectionColors.pricing)}>
        <SectionTitle eyebrow="Harga" title="Harga yang Jelas, Tanpa Kejutan" subtitle="Coba gratis 14 hari, tanpa kartu kredit. Upgrade kapan saja." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div key={String(p._id)} className="bg-white shadow-[0px_0px_4px_rgba(0,0,0,0.15)] text-center relative overflow-hidden flex flex-col h-full">
              <h3 className={`py-5 text-sm font-semibold uppercase tracking-wide ${i === 1 ? "bg-green text-white" : "bg-dark/5 text-dark/60"}`}>
                {p.name}
              </h3>
              <div className="px-6 pt-6 flex-1">
                <p className="text-4xl font-bold text-dark">
                  Rp {p.priceMonthly.toLocaleString("id-ID")}
                  <span className="block text-sm font-normal text-dark/40 mt-1">per bulan</span>
                </p>
                <ul className="py-6 text-sm text-dark/70 space-y-3">
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green shrink-0" strokeWidth={2} />
                    Maks {p.maxBranches >= 999 ? "tanpa batas" : p.maxBranches} cabang
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-green shrink-0" strokeWidth={2} />
                    Maks {p.maxUsers >= 999 ? "tanpa batas" : p.maxUsers} pengguna
                  </li>
                  {p.features.map((f: string) => (
                    <li key={f} className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-green shrink-0" strokeWidth={2} />
                      {FEATURE_LABELS[f] || f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-dark/5 py-5 mt-auto">
                <Link href="/register" className="inline-block px-9 py-2.5 bg-green text-white rounded-md text-sm font-semibold hover:brightness-95">
                  {i === 0 ? "Coba Gratis" : "Pilih Paket"}
                </Link>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="col-span-full text-center text-dark/40 text-sm">Paket harga belum tersedia.</p>
          )}
        </div>
      </section>

      {settings.faqs?.length > 0 && (
        <section id="faq" className="px-6 lg:px-16 py-16" style={colorVar(sectionColors.faq)}>
          <SectionTitle eyebrow="Pertanyaan Umum" title="Yang Sering Ditanyakan" />
          <Faq faqs={settings.faqs} layout={settings.faqLayout || "accordion"} />
        </section>
      )}

      <footer
        className="px-6 lg:px-16 py-14 bg-dark text-(--color-footer)"
        style={{ "--color-footer": sectionColors.footer || "#ffffff" } as CSSProperties}
      >
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 mb-10">
          <div>
            <span className="text-lg font-bold">{settings.siteName}</span>
            <p className="text-sm text-(--color-footer)/50 mt-2 leading-relaxed">{settings.tagline}</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Kontak</p>
            <div className="space-y-1.5 text-sm text-(--color-footer)/60">
              {settings.contact?.email && <p>{settings.contact.email}</p>}
              {settings.contact?.phone && <p>{settings.contact.phone}</p>}
              {settings.contact?.address && <p>{settings.contact.address}</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3">Tautan</p>
            <div className="space-y-1.5 text-sm text-(--color-footer)/60">
              <Link href="/login" className="block hover:opacity-80">Masuk Staf</Link>
              <Link href="/register" className="block hover:opacity-80">Daftarkan Klinik</Link>
              <Link href="#harga" className="block hover:opacity-80">Harga</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-(--color-footer)/10 text-sm text-(--color-footer)/40">
          &copy; {new Date().getFullYear()} Nusa Inspira Teknologi (RFS). Semua hak dilindungi.
        </div>
      </footer>
    </main>
  );
}
