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

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/users", label: "Manajemen User", icon: "👥" },
  { href: "/admin/settings", label: "Site Settings", icon: "⚙️" },
];

export default function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
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
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <p className="text-xl font-semibold text-lime">KlinikHub</p>
          <p className="text-xs text-white/50">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                  active ? "bg-green text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
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
          <p className="font-semibold text-dark">KlinikHub</p>
          <button onClick={() => setOpen(true)} className="text-dark cursor-pointer">
            ☰
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-8 bg-bg">{children}</main>
      </div>
    </div>
  );
}
