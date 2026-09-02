"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

type Settings = {
  siteName: string;
  tagline: string;
  description: string;
  logoBase64: string;
  faviconBase64: string;
  heroImageBase64: string;
  backgroundImageBase64: string;
  loginImageBase64: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    darkColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  contact: { email: string; phone: string; whatsapp: string; address: string };
  socials: { instagram: string; facebook: string; tiktok: string; youtube: string };
  hero: { title: string; subtitle: string; ctaText: string; ctaLink: string };
  features: { registrationEnabled: boolean; maintenanceMode: boolean; maintenanceMessage: string };
  faqs: { q: string; a: string }[];
  faqLayout: "accordion" | "grid";
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  function updateNested<K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) {
    setSettings((s) => (s ? { ...s, [key]: { ...(s[key] as object), ...patch } } : s));
  }

  function addFaq() {
    setSettings((s) => (s ? { ...s, faqs: [...s.faqs, { q: "", a: "" }] } : s));
  }

  function updateFaq(index: number, patch: Partial<{ q: string; a: string }>) {
    setSettings((s) => (s ? { ...s, faqs: s.faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)) } : s));
  }

  function removeFaq(index: number) {
    setSettings((s) => (s ? { ...s, faqs: s.faqs.filter((_, i) => i !== index) } : s));
  }

  async function onImageChange(
    field: "logoBase64" | "faviconBase64" | "heroImageBase64" | "backgroundImageBase64" | "loginImageBase64",
    file: File | undefined
  ) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB");
      return;
    }
    const base64 = await fileToBase64(file);
    update(field, base64 as never);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Gagal menyimpan pengaturan");
        return;
      }
      setMessage("Pengaturan berhasil disimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return <p className="text-dark/50">Memuat pengaturan...</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Site Settings</h1>
        <p className="text-dark/60">Kustomisasi tampilan dan konten situs sepenuhnya.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <h2 className="font-semibold text-dark mb-4">Identitas Situs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nama Situs</Label>
              <Input value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Label>Deskripsi</Label>
            <textarea
              className="w-full px-4 py-2.5 rounded-sm border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
              rows={3}
              value={settings.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <ImagePicker label="Logo" value={settings.logoBase64} onChange={(f) => onImageChange("logoBase64", f)} />
            <ImagePicker label="Favicon" value={settings.faviconBase64} onChange={(f) => onImageChange("faviconBase64", f)} />
            <ImagePicker label="Gambar Hero" value={settings.heroImageBase64} onChange={(f) => onImageChange("heroImageBase64", f)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <ImagePicker
              label="Gambar Latar Belakang"
              value={settings.backgroundImageBase64}
              onChange={(f) => onImageChange("backgroundImageBase64", f)}
            />
            <ImagePicker
              label="Gambar Halaman Login Staf"
              value={settings.loginImageBase64}
              onChange={(f) => onImageChange("loginImageBase64", f)}
            />
          </div>
          <p className="text-xs text-dark/40 mt-2">
            Gambar latar belakang ditampilkan penuh di belakang halaman utama, di bawah lapisan warna tema. Gambar
            halaman login ditampilkan di sisi kiri form masuk staf (/login).
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Tema & Warna</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorField label="Warna Utama" value={settings.theme.primaryColor} onChange={(v) => updateNested("theme", { primaryColor: v })} />
            <ColorField label="Warna Sekunder" value={settings.theme.secondaryColor} onChange={(v) => updateNested("theme", { secondaryColor: v })} />
            <ColorField label="Warna Gelap" value={settings.theme.darkColor} onChange={(v) => updateNested("theme", { darkColor: v })} />
            <ColorField label="Warna Latar" value={settings.theme.backgroundColor} onChange={(v) => updateNested("theme", { backgroundColor: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Font</Label>
              <Input value={settings.theme.fontFamily} onChange={(e) => updateNested("theme", { fontFamily: e.target.value })} />
            </div>
            <div>
              <Label>Border Radius</Label>
              <Input value={settings.theme.borderRadius} onChange={(e) => updateNested("theme", { borderRadius: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Hero Landing Page</h2>
          <div className="space-y-4">
            <div>
              <Label>Judul</Label>
              <Input value={settings.hero.title} onChange={(e) => updateNested("hero", { title: e.target.value })} />
            </div>
            <div>
              <Label>Subjudul</Label>
              <Input value={settings.hero.subtitle} onChange={(e) => updateNested("hero", { subtitle: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Teks Tombol CTA</Label>
                <Input value={settings.hero.ctaText} onChange={(e) => updateNested("hero", { ctaText: e.target.value })} />
              </div>
              <div>
                <Label>Link CTA</Label>
                <Input value={settings.hero.ctaLink} onChange={(e) => updateNested("hero", { ctaLink: e.target.value })} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Kontak & Sosial Media</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={settings.contact.email} onChange={(e) => updateNested("contact", { email: e.target.value })} />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input value={settings.contact.phone} onChange={(e) => updateNested("contact", { phone: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={settings.contact.whatsapp} onChange={(e) => updateNested("contact", { whatsapp: e.target.value })} />
            </div>
            <div>
              <Label>Alamat</Label>
              <Input value={settings.contact.address} onChange={(e) => updateNested("contact", { address: e.target.value })} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={settings.socials.instagram} onChange={(e) => updateNested("socials", { instagram: e.target.value })} />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={settings.socials.facebook} onChange={(e) => updateNested("socials", { facebook: e.target.value })} />
            </div>
            <div>
              <Label>TikTok</Label>
              <Input value={settings.socials.tiktok} onChange={(e) => updateNested("socials", { tiktok: e.target.value })} />
            </div>
            <div>
              <Label>YouTube</Label>
              <Input value={settings.socials.youtube} onChange={(e) => updateNested("socials", { youtube: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-dark mb-4">Fitur Situs</h2>
          <label className="flex items-center gap-2 text-sm text-dark/70 mb-3">
            <input
              type="checkbox"
              checked={settings.features.registrationEnabled}
              onChange={(e) => updateNested("features", { registrationEnabled: e.target.checked })}
            />
            Izinkan pendaftaran akun baru
          </label>
          <label className="flex items-center gap-2 text-sm text-dark/70 mb-3">
            <input
              type="checkbox"
              checked={settings.features.maintenanceMode}
              onChange={(e) => updateNested("features", { maintenanceMode: e.target.checked })}
            />
            Mode maintenance
          </label>
          {settings.features.maintenanceMode && (
            <div>
              <Label>Pesan Maintenance</Label>
              <Input
                value={settings.features.maintenanceMessage}
                onChange={(e) => updateNested("features", { maintenanceMessage: e.target.value })}
              />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark">FAQ Landing Page</h2>
            <div>
              <Label>Tampilan</Label>
              <Select
                value={settings.faqLayout}
                onChange={(e) => update("faqLayout", e.target.value as Settings["faqLayout"])}
                className="!py-1.5 !w-40"
              >
                <option value="accordion">Ringkas (accordion)</option>
                <option value="grid">Grid 2 kolom</option>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            {settings.faqs.map((f, i) => (
              <div key={i} className="border border-dark/10 rounded-sm p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="!mb-0">Pertanyaan {i + 1}</Label>
                  <button type="button" onClick={() => removeFaq(i)} className="text-red-500 text-xs font-medium hover:underline cursor-pointer shrink-0">
                    Hapus
                  </button>
                </div>
                <Input value={f.q} onChange={(e) => updateFaq(i, { q: e.target.value })} placeholder="Pertanyaan" />
                <textarea
                  className="w-full px-4 py-2.5 rounded-sm border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
                  rows={2}
                  value={f.a}
                  onChange={(e) => updateFaq(i, { a: e.target.value })}
                  placeholder="Jawaban"
                />
              </div>
            ))}
            {settings.faqs.length === 0 && <p className="text-dark/40 text-sm">Belum ada FAQ.</p>}
          </div>
          <Button type="button" variant="ghost" onClick={addFaq} className="mt-3 !px-4 !py-2 text-sm">
            + Tambah FAQ
          </Button>
        </Card>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green text-sm">{message}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
        </Button>
      </form>
    </div>
  );
}

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (f: File | undefined) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <Image src={value} alt={label} width={48} height={48} unoptimized className="rounded-sm object-cover w-12 h-12 border border-dark/10" />
        ) : (
          <div className="w-12 h-12 rounded-sm bg-bg border border-dark/10" />
        )}
        <input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} className="text-xs" />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-dark/15 cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
