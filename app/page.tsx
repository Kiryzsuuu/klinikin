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
  ArrowRight,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";

export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  { icon: Stethoscope, title: "RME Lengkap", desc: "Rekam medis elektronik dengan odontogram, skin chart, dan rujukan digital." },
  { icon: Pill, title: "Farmasi & Stok", desc: "Kelola stok obat multi-cabang, batch, dan transfer antar cabang secara real-time." },
  { icon: Receipt, title: "Kasir & Invoice", desc: "Penagihan cepat untuk pasien umum, BPJS, maupun asuransi swasta." },
  { icon: CalendarCheck, title: "Booking Online", desc: "Pasien bisa booking konsultasi tatap muka maupun online lewat portal klinik Anda." },
];

const FEATURE_LIST = [
  { icon: Sparkles, title: "Asisten AI", desc: "Ringkasan otomatis, saran diagnosis, hingga prediksi stok dan pendapatan." },
  { icon: Users, title: "SDM & Jadwal", desc: "Atur jadwal praktik dan shift staf di semua cabang dari satu tempat." },
  { icon: ShieldCheck, title: "Audit & Keamanan", desc: "Audit log lengkap dan MFA untuk melindungi data medis pasien Anda." },
  { icon: Building2, title: "Multi-Cabang", desc: "Kelola semua cabang klinik dari satu akun, satu dashboard terpusat." },
];

const STATS = [
  { icon: Clock, value: "14 Hari", label: "Masa trial gratis" },
  { icon: Building2, value: "Tanpa Batas", label: "Cabang di paket Enterprise" },
  { icon: CalendarCheck, value: "24/7", label: "Booking online untuk pasien" },
  { icon: ShieldCheck, value: "MFA", label: "Keamanan akun staf" },
];

const FAQS = [
  { q: "Apakah butuh kartu kredit untuk mencoba", a: "Tidak. Trial 14 hari langsung aktif begitu klinik selesai mendaftar, tanpa perlu memasukkan data pembayaran." },
  { q: "Bagaimana jika klinik saya punya lebih dari satu cabang", a: "KlinikKita didesain untuk multi-cabang sejak awal. Satu akun klinik bisa mengelola semua cabangnya dari satu dashboard." },
  { q: "Apakah data klinik saya tercampur dengan klinik lain", a: "Tidak. Setiap klinik memiliki data yang terisolasi sepenuhnya, staf dan pasien klinik lain tidak akan pernah terlihat." },
  { q: "Bagaimana cara berlangganan setelah masa trial habis", a: "Pilih paket di halaman Billing pada dashboard admin, pembayaran diproses aman melalui Midtrans." },
];

export default async function Home() {
  await connectDB();
  const [settings, plans] = await Promise.all([
    getOrCreateSettings(),
    SubscriptionPlan.find({ isActive: true }).sort({ priceMonthly: 1 }),
  ]);

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

  const hasBackground = Boolean(settings.backgroundImageBase64);

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-dark/5">
        <div className="flex items-center justify-between px-6 lg:px-16 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {settings.logoBase64 ? (
              <Image src={settings.logoBase64} alt={settings.siteName} width={40} height={40} unoptimized className="rounded-2xl w-10 h-10 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-green flex items-center justify-center text-white font-bold">
                {settings.siteName?.charAt(0) || "K"}
              </div>
            )}
            <span className="text-lg font-bold text-dark">{settings.siteName}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-dark/70">
            <Link href="#fitur" className="hover:text-dark">Fitur</Link>
            <Link href="#harga" className="hover:text-dark">Harga</Link>
            <Link href="#faq" className="hover:text-dark">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-2 text-sm font-medium text-dark/70 hover:text-dark">
              Masuk
            </Link>
            {settings.features?.registrationEnabled && (
              <Link href="/register" className="px-5 py-2.5 bg-green text-white rounded-2xl text-sm font-semibold shadow-lg shadow-green/30">
                Daftarkan Klinik
              </Link>
            )}
          </div>
        </div>
      </header>

      <section
        className="relative px-6 lg:px-16 pt-16 pb-28 lg:pt-24 lg:pb-36"
        style={
          hasBackground
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(18,28,26,0.8), rgba(18,28,26,0.6)), url(${settings.backgroundImageBase64})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 ${
                hasBackground ? "bg-white/15 text-white" : "bg-lime/40 text-dark"
              }`}
            >
              {settings.tagline}
            </span>
            <h1 className={`text-4xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 ${hasBackground ? "text-white" : "text-dark"}`}>
              {settings.hero.title}
            </h1>
            <p className={`text-lg mb-10 max-w-lg leading-relaxed ${hasBackground ? "text-white/80" : "text-dark/60"}`}>{settings.hero.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={settings.hero.ctaLink}
                className="inline-flex items-center gap-2 px-8 py-4 bg-green text-white rounded-2xl font-semibold shadow-xl shadow-green/30 hover:brightness-95"
              >
                {settings.hero.ctaText}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#fitur"
                className={`inline-block px-8 py-4 rounded-2xl font-semibold border ${
                  hasBackground ? "border-white/30 text-white hover:bg-white/10" : "border-dark/15 text-dark hover:bg-dark/5"
                }`}
              >
                Lihat Fitur
              </Link>
            </div>
          </div>

          {!hasBackground && (
            <div className="relative">
              {settings.heroImageBase64 ? (
                <Image
                  src={settings.heroImageBase64}
                  alt="Ilustrasi platform"
                  width={640}
                  height={520}
                  unoptimized
                  className="rounded-[2.5rem] object-cover w-full aspect-4/3 shadow-2xl"
                />
              ) : (
                <div className="rounded-[2.5rem] bg-linear-to-br from-lime/50 via-green/30 to-dark/20 aspect-4/3" />
              )}
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto mt-16 lg:mt-20 relative">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-dark/10 px-6 lg:px-10 py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-lime/30 text-dark flex items-center justify-center shrink-0">
                  <s.icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-dark leading-tight">{s.value}</p>
                  <p className="text-xs text-dark/50">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fitur" className="px-6 lg:px-16 pt-24 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {HIGHLIGHTS.map((f) => (
            <div key={f.title} className="bg-white rounded-3xl p-7 shadow-sm border border-dark/5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green/10 text-green flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h3 className="font-bold text-dark mb-2">{f.title}</h3>
              <p className="text-sm text-dark/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-dark text-white px-8 py-14 lg:px-16 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-lg text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-extrabold mb-3">Siap memindahkan klinik Anda ke sistem digital</h2>
            <p className="text-white/70">Trial 14 hari penuh fitur inti, tanpa kartu kredit, dan bisa upgrade kapan saja.</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-lime text-dark rounded-2xl font-semibold shadow-xl hover:brightness-95"
          >
            Daftarkan Klinik Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="px-6 lg:px-16 py-16 bg-white/60">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2.5rem] bg-linear-to-br from-green/20 via-lime/30 to-dark/10 aspect-4/3" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-bold text-green uppercase tracking-wide mb-3">Kenapa KlinikKita</p>
            <h2 className="text-3xl font-extrabold text-dark mb-4">Dibangun khusus untuk operasional klinik Indonesia</h2>
            <p className="text-dark/60 mb-8 leading-relaxed">
              Dari pendaftaran pasien di meja depan sampai laporan keuangan bulanan, semua tercatat rapi dalam satu sistem
              yang bisa diakses tim Anda kapan saja.
            </p>
            <div className="space-y-6">
              {FEATURE_LIST.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green/10 text-green flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5" strokeWidth={1.75} />
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

      <section id="harga" className="px-6 lg:px-16 py-16">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <p className="text-sm font-bold text-green uppercase tracking-wide mb-3">Harga</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-dark mb-3">Harga yang Jelas, Tanpa Kejutan</h2>
          <p className="text-dark/60">Coba gratis 14 hari, tanpa kartu kredit. Upgrade kapan saja.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div
              key={String(p._id)}
              className={`rounded-3xl p-8 shadow-sm border flex flex-col ${
                i === 1 ? "bg-dark text-white border-dark scale-105" : "bg-white border-dark/5"
              }`}
            >
              <h3 className={`font-bold text-lg mb-2 ${i === 1 ? "text-white" : "text-dark"}`}>{p.name}</h3>
              <p className={`text-3xl font-extrabold mb-6 ${i === 1 ? "text-lime" : "text-green"}`}>
                Rp {p.priceMonthly.toLocaleString("id-ID")}
                <span className={`text-sm font-normal ${i === 1 ? "text-white/50" : "text-dark/50"}`}>/bulan</span>
              </p>
              <ul className={`text-sm space-y-3 mb-8 flex-1 ${i === 1 ? "text-white/80" : "text-dark/70"}`}>
                <li className={`pl-3 border-l-2 ${i === 1 ? "border-lime" : "border-green"}`}>
                  Maks {p.maxBranches >= 999 ? "tanpa batas" : p.maxBranches} cabang
                </li>
                <li className={`pl-3 border-l-2 ${i === 1 ? "border-lime" : "border-green"}`}>
                  Maks {p.maxUsers >= 999 ? "tanpa batas" : p.maxUsers} pengguna
                </li>
                {p.features.map((f: string) => (
                  <li key={f} className={`pl-3 border-l-2 ${i === 1 ? "border-lime" : "border-green"}`}>{f}</li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`text-center px-5 py-3 rounded-2xl text-sm font-semibold shadow-md ${
                  i === 1 ? "bg-lime text-dark" : "bg-green text-white shadow-green/30"
                }`}
              >
                Coba Gratis
              </Link>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="col-span-full text-center text-dark/40 text-sm">Paket harga belum tersedia.</p>
          )}
        </div>
      </section>

      <section id="faq" className="px-6 lg:px-16 py-16 bg-white/60">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <p className="text-sm font-bold text-green uppercase tracking-wide mb-3">Pertanyaan Umum</p>
          <h2 className="text-3xl font-extrabold text-dark">Yang Sering Ditanyakan</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="bg-white rounded-2xl p-6 shadow-sm border border-dark/5">
              <h3 className="font-bold text-dark mb-2">{f.q}</h3>
              <p className="text-sm text-dark/60 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 lg:px-16 py-12 border-t border-dark/10">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8 mb-10">
          <div>
            <span className="text-lg font-bold text-dark">{settings.siteName}</span>
            <p className="text-sm text-dark/50 mt-2 leading-relaxed">{settings.tagline}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-dark mb-3">Kontak</p>
            <div className="space-y-1.5 text-sm text-dark/60">
              {settings.contact?.email && <p>{settings.contact.email}</p>}
              {settings.contact?.phone && <p>{settings.contact.phone}</p>}
              {settings.contact?.address && <p>{settings.contact.address}</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-dark mb-3">Tautan</p>
            <div className="space-y-1.5 text-sm text-dark/60">
              <Link href="/login" className="block hover:text-dark">Masuk Staf</Link>
              <Link href="/register" className="block hover:text-dark">Daftarkan Klinik</Link>
              <Link href="#harga" className="block hover:text-dark">Harga</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-6 border-t border-dark/10 text-sm text-dark/40">
          &copy; {new Date().getFullYear()} {settings.siteName}. Semua hak dilindungi.
        </div>
      </footer>
    </main>
  );
}
