"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

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

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/branches", label: "Manajemen Cabang" },
  { href: "/admin/patients", label: "Data Pasien / RME" },
  { href: "/admin/pharmacy", label: "Farmasi & Stok" },
  { href: "/admin/cashier", label: "Kasir & Invoice" },
  { href: "/admin/bookings", label: "Booking Pasien" },
  { href: "/admin/lab", label: "Lab & Radiologi" },
  { href: "/admin/insurance", label: "Asuransi Swasta" },
  { href: "/admin/procurement", label: "Procurement Obat" },
  { href: "/admin/hr", label: "SDM & Jadwal" },
  { href: "/admin/accreditation", label: "Akreditasi" },
  { href: "/admin/chat", label: "Asisten AI" },
  { href: "/admin/users", label: "Manajemen User" },
  { href: "/admin/api-keys", label: "API Publik" },
  { href: "/admin/audit-log", label: "Audit Log" },
  { href: "/admin/security", label: "Keamanan (MFA)" },
  { href: "/admin/billing", label: "Langganan & Billing" },
  { href: "/admin/settings", label: "Site Settings" },
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
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xl font-semibold text-lime">KlinikKita</p>
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
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border-l-2 transition ${
                  active
                    ? "bg-green text-white border-lime"
                    : "text-white/70 border-transparent hover:bg-white/10 hover:text-white"
                } ${locked ? "opacity-50" : ""}`}
                title={locked ? "Terkunci selama trial, upgrade untuk membuka" : undefined}
              >
                <span className="text-sm font-medium">{item.label}</span>
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
              <div className="w-9 h-9 rounded-full bg-lime text-dark flex items-center justify-center font-semibold">
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
            className="w-full text-sm bg-white/10 hover:bg-white/20 rounded-xl py-2 cursor-pointer"
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
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-dark/10">
          <p className="font-semibold text-dark">KlinikKita</p>
          <button onClick={() => setOpen(true)} className="text-dark text-sm font-medium cursor-pointer">
            Menu
          </button>
        </header>
        {isTrial && (
          <div className="px-6 lg:px-8 pt-4">
            <div className="bg-lime/30 border border-lime text-dark text-sm rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
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
            <div className="bg-red-100 border border-red-300 text-red-800 text-sm rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <span>Langganan Anda tidak aktif. Perbarui langganan untuk terus menggunakan KlinikKita.</span>
              <Link href="/admin/billing" className="font-semibold underline shrink-0">
                Perbarui sekarang
              </Link>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 lg:p-8 bg-bg">{children}</main>
      </div>
    </div>
  );
}
