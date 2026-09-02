"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const NAV = [
  { href: "/superadmin", label: "Dashboard" },
  { href: "/superadmin/clinics", label: "Klinik" },
  { href: "/superadmin/plans", label: "Paket Langganan" },
  { href: "/superadmin/payments", label: "Pembayaran" },
  { href: "/superadmin/settings", label: "Site Settings" },
];

export default function SuperAdminShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xl font-semibold text-lime">KlinikKita</p>
          <p className="text-xs text-white/50">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl border-l-2 transition ${
                  active
                    ? "bg-green text-white border-lime"
                    : "text-white/70 border-transparent hover:bg-white/10 hover:text-white"
                }`}
              >
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

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-dark/10">
          <p className="font-semibold text-dark">KlinikKita · Super Admin</p>
          <button onClick={() => setOpen(true)} className="text-dark text-sm font-medium cursor-pointer">
            Menu
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-8 bg-bg">{children}</main>
      </div>
    </div>
  );
}
