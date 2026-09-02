import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/models/SiteSettings";
import { SubscriptionPlan } from "@/models/SubscriptionPlan";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "🩺", title: "RME Lengkap", desc: "Rekam medis elektronik dengan odontogram, skin chart, hingga rujukan digital." },
  { icon: "💊", title: "Farmasi & Stok", desc: "Kelola stok obat multi-cabang, batch, dan transfer antar cabang secara real-time." },
  { icon: "🧾", title: "Kasir & Invoice", desc: "Penagihan cepat untuk pasien umum, BPJS, maupun asuransi swasta." },
  { icon: "📅", title: "Booking Online", desc: "Pasien bisa booking konsultasi tatap muka maupun online lewat portal khusus klinik Anda." },
  { icon: "✨", title: "Asisten AI", desc: "Ringkasan otomatis, saran diagnosis, hingga prediksi stok & pendapatan." },
  { icon: "🗓️", title: "SDM & Jadwal", desc: "Atur jadwal praktik dan shift staf di semua cabang dari satu tempat." },
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
          <Link href="#harga" className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Harga
          </Link>
          <Link href="/login" className="px-4 py-2 text-dark/70 hover:text-dark text-sm font-medium">
            Masuk
          </Link>
          {settings.features?.registrationEnabled && (
            <Link href="/register" className="px-5 py-2 bg-green text-white rounded-2xl text-sm font-medium shadow-md shadow-green/30">
              Daftarkan Klinik
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

      <section className="px-6 lg:px-16 py-16 bg-white/60">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-dark mb-3">Semua yang Klinik Anda Butuhkan</h2>
          <p className="text-dark/60 max-w-xl mx-auto">Satu platform terintegrasi untuk operasional klinik modern, dari front office sampai laporan keuangan.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-3xl p-6 shadow-sm border border-dark/5">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-dark mb-1.5">{f.title}</h3>
              <p className="text-sm text-dark/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="harga" className="px-6 lg:px-16 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-dark mb-3">Harga yang Jelas, Tanpa Kejutan</h2>
          <p className="text-dark/60 max-w-xl mx-auto">Coba gratis 14 hari, tanpa kartu kredit. Upgrade kapan saja.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={String(p._id)} className="bg-white rounded-3xl p-6 shadow-sm border border-dark/5 flex flex-col">
              <h3 className="font-semibold text-dark text-lg mb-2">{p.name}</h3>
              <p className="text-3xl font-semibold text-green mb-4">
                Rp {p.priceMonthly.toLocaleString("id-ID")}
                <span className="text-sm text-dark/50 font-normal">/bulan</span>
              </p>
              <ul className="text-sm text-dark/70 space-y-1.5 mb-6 flex-1">
                <li>Maks {p.maxBranches >= 999 ? "tanpa batas" : p.maxBranches} cabang</li>
                <li>Maks {p.maxUsers >= 999 ? "tanpa batas" : p.maxUsers} pengguna</li>
                {p.features.map((f: string) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link
                href="/register"
                className="text-center px-5 py-2.5 bg-green text-white rounded-2xl text-sm font-medium shadow-md shadow-green/30 hover:brightness-95"
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
