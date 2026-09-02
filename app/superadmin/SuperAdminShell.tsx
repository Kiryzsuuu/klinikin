"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { LayoutDashboard, Building2, Package, CreditCard, Settings, type LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/clinics", label: "Klinik", icon: Building2 },
  { href: "/superadmin/plans", label: "Paket Langganan", icon: Package },
  { href: "/superadmin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/superadmin/settings", label: "Site Settings", icon: Settings },
];

export default function SuperAdminShell({
  user,
  theme,
  children,
}: {
  user: { name: string; email: string };
  theme?: { primaryColor?: string; secondaryColor?: string; darkColor?: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={
        {
          "--color-green": theme?.primaryColor || "#1B686B",
          "--color-lime": theme?.secondaryColor || "#1B686B",
          "--color-dark": theme?.darkColor || "#406661",
        } as CSSProperties
      }
    >
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 h-screen w-64 shrink-0 bg-dark text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xl font-semibold text-white">KlinikKita</p>
          <p className="text-xs text-white/50">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-sm border-l-2 transition ${
                  active
                    ? "bg-green text-white border-lime"
                    : "text-white/70 border-transparent hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0 mr-3" strokeWidth={1.75} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/50 truncate">{user.email}</p>
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

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden shrink-0 sticky top-0 z-20 flex items-center justify-between p-4 bg-white border-b border-dark/10">
          <p className="font-semibold text-dark">KlinikKita · Super Admin</p>
          <button onClick={() => setOpen(true)} className="text-dark text-sm font-medium cursor-pointer">
            Menu
          </button>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8 bg-bg">{children}</main>
      </div>
    </div>
  );
}
