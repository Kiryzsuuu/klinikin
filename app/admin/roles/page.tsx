"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card } from "@/components/ui";
import { FEATURE_KEYS, CONFIGURABLE_ROLES } from "@/lib/features";

type Permissions = Record<string, string[]>;

export default function RolesPage() {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/role-permissions");
      const json = await res.json();
      if (json.success) setPermissions(json.data);
      else setError(json.error?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  function toggle(role: string, key: string) {
    setPermissions((p) => {
      if (!p) return p;
      const current = p[role] || [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      return { ...p, [role]: next };
    });
  }

  async function onSave() {
    if (!permissions) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan");
        return;
      }
      setMessage("Akses role berhasil disimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !permissions) {
    return <p className="text-dark/50">Memuat...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Role & Akses</h1>
        <p className="text-dark/60">Atur modul mana yang bisa diakses tiap role staf di klinik Anda.</p>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Modul</th>
                {CONFIGURABLE_ROLES.map((role) => (
                  <th key={role} className="py-2 px-3 text-center whitespace-nowrap">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_KEYS.map((f) => (
                <tr key={f.key} className="border-b border-dark/5 last:border-0">
                  <td className="py-2.5 pr-4 text-dark">{f.label}</td>
                  {CONFIGURABLE_ROLES.map((role) => (
                    <td key={role} className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={(permissions[role] || []).includes(f.key)}
                        onChange={() => toggle(role, f.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-dark/40 mt-4">
          OWNER dan ADMIN_PUSAT selalu punya akses penuh ke semua modul dan tidak tercantum di sini. Modul yang
          tidak dicentang untuk suatu role juga tetap mengikuti batas paket langganan klinik.
        </p>
      </Card>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green text-sm">{message}</p>}

      <Button onClick={onSave} disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Akses Role"}
      </Button>
    </div>
  );
}
