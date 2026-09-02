"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  Pill,
  Receipt,
  CalendarCheck,
  FlaskConical,
  ShieldCheck,
  Package,
  Users,
  ClipboardList,
  Sparkles,
  UserCog,
  KeyRound,
  ScrollText,
  Lock,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

type SessionUser = {
  name: string;
  email: string;
  role: string;
  photoBase64: string;
};

type ClinicInfo = {
  name: string;
  status: string;
  trialEndsAt: string | null;
} | null;

const TRIAL_LOCKED_HREFS = new Set([
  "/admin/insurance",
  "/admin/procurement",
  "/admin/chat",
  "/admin/api-keys",
]);

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/branches", label: "Manajemen Cabang", icon: Building2 },
  { href: "/admin/patients", label: "Data Pasien / RME", icon: Stethoscope },
  { href: "/admin/pharmacy", label: "Farmasi & Stok", icon: Pill },
  { href: "/admin/cashier", label: "Kasir & Invoice", icon: Receipt },
  { href: "/admin/bookings", label: "Booking Pasien", icon: CalendarCheck },
  { href: "/admin/lab", label: "Lab & Radiologi", icon: FlaskConical },
  { href: "/admin/insurance", label: "Asuransi Swasta", icon: ShieldCheck },
  { href: "/admin/procurement", label: "Procurement Obat", icon: Package },
  { href: "/admin/hr", label: "SDM & Jadwal", icon: Users },
  { href: "/admin/accreditation", label: "Akreditasi", icon: ClipboardList },
  { href: "/admin/chat", label: "Asisten AI", icon: Sparkles },
  { href: "/admin/users", label: "Manajemen User", icon: UserCog },
  { href: "/admin/api-keys", label: "API Publik", icon: KeyRound },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/security", label: "Keamanan (MFA)", icon: Lock },
  { href: "/admin/billing", label: "Langganan & Billing", icon: CreditCard },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AdminShell({
  user,
  clinic,
  children,
}: {
  user: SessionUser;
  clinic: ClinicInfo;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isTrial = clinic?.status === "TRIAL";
  const isBlocked = clinic?.status === "EXPIRED" || clinic?.status === "PAST_DUE";
  const trialDays = isTrial ? daysLeft(clinic?.trialEndsAt ?? null) : null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 h-screen w-64 shrink-0 bg-dark text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xl font-semibold text-white">KlinikKita</p>
          <p className="text-xs text-white/50 truncate">{clinic?.name || "Admin Panel"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const locked = isTrial && TRIAL_LOCKED_HREFS.has(item.href);
            return (
              <Link
                key={item.href}
                href={locked ? "/admin/billing" : item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-sm border-l-2 transition ${
                  active
                    ? "bg-green text-white border-lime"
                    : "text-white/70 border-transparent hover:bg-white/10 hover:text-white"
                } ${locked ? "opacity-50" : ""}`}
                title={locked ? "Terkunci selama trial, upgrade untuk membuka" : undefined}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </span>
                {locked && (
                  <span className="text-[10px] uppercase tracking-wide bg-white/10 px-1.5 py-0.5 rounded-md shrink-0">
                    Terkunci
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {user.photoBase64 ? (
              <Image
                src={user.photoBase64}
                alt={user.name}
                width={36}
                height={36}
                className="rounded-full object-cover w-9 h-9"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-lime text-white flex items-center justify-center font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-sm bg-white/10 hover:bg-white/20 rounded-sm py-2 cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </aside>

      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          aria-label="Tutup menu"
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden shrink-0 sticky top-0 z-20 flex items-center justify-between p-4 bg-white border-b border-dark/10">
          <p className="font-semibold text-dark">KlinikKita</p>
          <button onClick={() => setOpen(true)} className="text-dark text-sm font-medium cursor-pointer">
            Menu
          </button>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-bg">
          {isTrial && (
            <div className="px-6 lg:px-8 pt-4">
              <div className="bg-green/10 border border-green/40 text-dark text-sm rounded-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Anda sedang di masa trial{trialDays !== null ? `, ${trialDays} hari tersisa` : ""}. Sebagian fitur
                  terkunci.
                </span>
                <Link href="/admin/billing" className="font-semibold underline shrink-0">
                  Upgrade sekarang
                </Link>
              </div>
            </div>
          )}
          {isBlocked && (
            <div className="px-6 lg:px-8 pt-4">
              <div className="bg-red-100 border border-red-300 text-red-800 text-sm rounded-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <span>Langganan Anda tidak aktif. Perbarui langganan untuk terus menggunakan KlinikKita.</span>
                <Link href="/admin/billing" className="font-semibold underline shrink-0">
                  Perbarui sekarang
                </Link>
              </div>
            </div>
          )}
          <main className="p-6 lg:p-8 bg-bg">{children}</main>
        </div>
      </div>
    </div>
  );
}
