"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Card, Input, Label, Badge } from "@/components/ui";

const SCOPES = ["patients:read", "visits:read", "branches:read"];

type KeyRow = { _id: string; name: string; keyPrefix: string; scopes: string[]; isActive: boolean; lastUsedAt?: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys");
      const json = await res.json();
      if (json.success) setKeys(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  function toggleScope(s: string) {
    setScopes((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (scopes.length === 0) {
      setError("Pilih minimal 1 scope");
      return;
    }
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message || "Gagal membuat API key");
      return;
    }
    setNewKey(json.data.apiKey);
    setName("");
    setScopes([]);
    load();
  }

  async function revoke(id: string) {
    if (!confirm("Cabut API key ini? Tidak bisa dibatalkan.")) return;
    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark">API Publik</h1>
          <p className="text-dark/60">
            Kelola API key untuk integrasi pihak ketiga. Base URL: <code className="bg-bg px-1.5 py-0.5 rounded">/api/public/v1</code>, auth via header <code className="bg-bg px-1.5 py-0.5 rounded">X-API-Key</code>.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Buat API Key</Button>
      </div>

      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark/50 border-b border-dark/10">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Prefix</th>
                <th className="py-2 pr-4">Scopes</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="py-6 text-center text-dark/40">Memuat...</td></tr>}
              {!loading && keys.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-dark/40">Belum ada API key</td></tr>}
              {keys.map((k) => (
                <tr key={k._id} className="border-b border-dark/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-dark">{k.name}</td>
                  <td className="py-3 pr-4 text-dark/70 font-mono text-xs">{k.keyPrefix}...</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => <Badge key={s} tone="lime">{s}</Badge>)}
                    </div>
                  </td>
                  <td className="py-3 pr-4"><Badge tone={k.isActive ? "green" : "gray"}>{k.isActive ? "Aktif" : "Dicabut"}</Badge></td>
                  <td className="py-3 pr-4 text-right">
                    {k.isActive && (
                      <button onClick={() => revoke(k._id)} className="text-red-500 font-medium hover:underline cursor-pointer">Cabut</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            {newKey ? (
              <>
                <h2 className="text-xl font-semibold text-dark mb-2">API Key Dibuat</h2>
                <p className="text-sm text-red-500 mb-3">Salin sekarang — key ini tidak akan ditampilkan lagi.</p>
                <div className="bg-bg rounded-xl p-3 font-mono text-sm break-all mb-4">{newKey}</div>
                <Button onClick={() => { setShowForm(false); setNewKey(""); }} className="w-full">Selesai</Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-dark mb-4">Buat API Key</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <Label>Nama</Label>
                    <Input required placeholder="Integrasi Sistem Akuntansi" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Scopes</Label>
                    <div className="space-y-2">
                      {SCOPES.map((s) => (
                        <label key={s} className="flex items-center gap-2 text-sm text-dark/70">
                          <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1">Buat</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
