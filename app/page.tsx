import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "RME Lengkap", desc: "Rekam medis elektronik dengan odontogram, skin chart, hingga rujukan digital." },
  { title: "Farmasi & Stok", desc: "Kelola stok obat multi-cabang, batch, dan transfer antar cabang secara real-time." },
  { title: "Kasir & Invoice", desc: "Penagihan cepat untuk pasien umum, BPJS, maupun asuransi swasta." },
  { title: "Booking Online", desc: "Pasien bisa booking konsultasi tatap muka maupun online lewat portal khusus klinik Anda." },
  { title: "Asisten AI", desc: "Ringkasan otomatis, saran diagnosis, hingga prediksi stok dan pendapatan." },
  { title: "SDM & Jadwal", desc: "Atur jadwal praktik dan shift staf di semua cabang dari satu tempat." },
];

const STATS = [
  { value: "14 Hari", label: "Masa trial gratis" },
  { value: "Multi-Cabang", label: "Satu akun, semua cabang" },
  { value: "24/7", label: "Booking online untuk pasien" },
];

const STEPS = [
  { step: "01", title: "Daftarkan Klinik", desc: "Isi nama klinik dan data owner, akun langsung aktif dengan masa trial 14 hari." },
  { step: "02", title: "Atur Cabang & Tim", desc: "Tambahkan cabang, undang dokter, perawat, apoteker, dan kasir sesuai peran masing-masing." },
  { step: "03", title: "Mulai Layani Pasien", desc: "Terima booking online, catat rekam medis, dan kelola pembayaran dari satu dashboard." },
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
      <header className="flex items-center justify-between px-6 lg:px-16 py-6 relative z-10">
        <div className="flex items-center gap-3">
          {settings.logoBase64 ? (
            <Image src={settings.logoBase64} alt={settings.siteName} width={40} height={40} unoptimized className="rounded-2xl w-10 h-10 object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-green flex items-center justify-center text-white font-bold">
              {settings.siteName?.charAt(0) || "K"}
            </div>
          )}
          <span className={`text-lg font-bold ${hasBackground ? "text-white" : "text-dark"}`}>{settings.siteName}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="#fitur" className={`hidden sm:inline px-3 py-2 text-sm font-medium ${hasBackground ? "text-white/80 hover:text-white" : "text-dark/70 hover:text-dark"}`}>
            Fitur
          </Link>
          <Link href="#harga" className={`hidden sm:inline px-3 py-2 text-sm font-medium ${hasBackground ? "text-white/80 hover:text-white" : "text-dark/70 hover:text-dark"}`}>
            Harga
          </Link>
          <Link href="/login" className={`px-3 py-2 text-sm font-medium ${hasBackground ? "text-white/80 hover:text-white" : "text-dark/70 hover:text-dark"}`}>
            Masuk
          </Link>
          {settings.features?.registrationEnabled && (
            <Link href="/register" className="px-5 py-2.5 bg-green text-white rounded-2xl text-sm font-semibold shadow-lg shadow-green/30">
              Daftarkan Klinik
            </Link>
          )}
        </div>
      </header>

      <section
        className="relative px-6 lg:px-16 pt-16 pb-24 lg:pt-24 lg:pb-32"
        style={
          hasBackground
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(18,28,26,0.8), rgba(18,28,26,0.6))${settings.backgroundImageBase64 ? `, url(${settings.backgroundImageBase64})` : ""}`,
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
                className="inline-block px-8 py-4 bg-green text-white rounded-2xl font-semibold shadow-xl shadow-green/30 hover:brightness-95"
              >
                {settings.hero.ctaText}
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

            <div className={`grid grid-cols-3 gap-6 mt-16 pt-8 border-t ${hasBackground ? "border-white/15" : "border-dark/10"}`}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className={`text-xl font-extrabold ${hasBackground ? "text-white" : "text-dark"}`}>{s.value}</p>
                  <p className={`text-xs mt-1 ${hasBackground ? "text-white/60" : "text-dark/50"}`}>{s.label}</p>
                </div>
              ))}
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
      </section>

      <section className="px-6 lg:px-16 py-16">
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-white rounded-3xl p-8 shadow-sm border border-dark/5">
              <p className="text-sm font-bold text-green mb-3">{s.step}</p>
              <h3 className="font-bold text-dark text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-dark/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fitur" className="px-6 lg:px-16 py-16 bg-white/60">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <p className="text-sm font-bold text-green uppercase tracking-wide mb-3">Fitur Platform</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-dark mb-3">Semua yang Klinik Anda Butuhkan</h2>
          <p className="text-dark/60">Satu platform terintegrasi untuk operasional klinik modern, dari front office sampai laporan keuangan.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-3xl p-7 shadow-sm border border-dark/5 border-t-4 border-t-green">
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
            className="shrink-0 px-8 py-4 bg-lime text-dark rounded-2xl font-semibold shadow-xl hover:brightness-95"
          >
            Daftarkan Klinik Gratis
          </Link>
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
