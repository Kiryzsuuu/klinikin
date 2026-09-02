"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, Input, Label } from "@/components/ui";
import { fileToBase64 } from "@/lib/fileToBase64";

type GalleryItem = { imageBase64: string; caption: string };

type ClinicSettings = {
  name: string;
  logoBase64: string;
  contact: { phone: string; whatsapp: string; email: string; address: string };
  settings: {
    tagline: string;
    description: string;
    heroImageBase64: string;
    backgroundImageBase64: string;
    theme: { primaryColor: string; secondaryColor: string; darkColor: string };
    hero: { title: string; subtitle: string; ctaText: string };
    socials: { instagram: string; facebook: string; tiktok: string; whatsapp: string };
    gallery: GalleryItem[];
  };
};

export default function ClinicSettingsForm({
  getUrl,
  putUrl,
  extractClinic = (data) => data as ClinicSettings,
}: {
  getUrl: string;
  putUrl: string;
  extractClinic?: (data: unknown) => ClinicSettings;
}) {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(getUrl)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setClinic(extractClinic(json.data));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mount
  }, [getUrl]);

  function update(patch: Partial<ClinicSettings>) {
    setClinic((c) => (c ? { ...c, ...patch } : c));
  }

  function updateSettings(patch: Partial<ClinicSettings["settings"]>) {
    setClinic((c) => (c ? { ...c, settings: { ...c.settings, ...patch } } : c));
  }

  function updateContact(patch: Partial<ClinicSettings["contact"]>) {
    setClinic((c) => (c ? { ...c, contact: { ...c.contact, ...patch } } : c));
  }

  async function onImage(file: File | undefined, apply: (base64: string) => void) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB");
      return;
    }
    apply((await fileToBase64(file)) as string);
  }

  function addGalleryItem(base64: string) {
    if (!clinic) return;
    updateSettings({ gallery: [...clinic.settings.gallery, { imageBase64: base64, caption: "" }] });
  }

  function removeGalleryItem(index: number) {
    if (!clinic) return;
    updateSettings({ gallery: clinic.settings.gallery.filter((_, i) => i !== index) });
  }

  function updateGalleryCaption(index: number, caption: string) {
    if (!clinic) return;
    updateSettings({
      gallery: clinic.settings.gallery.map((g, i) => (i === index ? { ...g, caption } : g)),
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinic) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic),
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

  if (loading || !clinic) return <p className="text-dark/50">Memuat pengaturan...</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <Card>
        <h2 className="font-semibold text-dark mb-4">Identitas Klinik</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nama Klinik</Label>
            <Input value={clinic.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={clinic.settings.tagline} onChange={(e) => updateSettings({ tagline: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <Label>Deskripsi</Label>
          <textarea
            className="w-full px-4 py-2.5 rounded-xl border border-dark/15 bg-white focus:outline-none focus:ring-2 focus:ring-green/50"
            rows={3}
            value={clinic.settings.description}
            onChange={(e) => updateSettings({ description: e.target.value })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <ImagePicker label="Logo" value={clinic.logoBase64} onChange={(f) => onImage(f, (b) => update({ logoBase64: b }))} />
          <ImagePicker
            label="Gambar Hero"
            value={clinic.settings.heroImageBase64}
            onChange={(f) => onImage(f, (b) => updateSettings({ heroImageBase64: b }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <ImagePicker
            label="Gambar Latar Belakang"
            value={clinic.settings.backgroundImageBase64}
            onChange={(f) => onImage(f, (b) => updateSettings({ backgroundImageBase64: b }))}
          />
        </div>
        <p className="text-xs text-dark/40 mt-2">
          Gambar latar belakang ditampilkan penuh di belakang halaman publik klinik Anda.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Warna Tema</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <ColorField label="Warna Utama" value={clinic.settings.theme.primaryColor} onChange={(v) => updateSettings({ theme: { ...clinic.settings.theme, primaryColor: v } })} />
          <ColorField label="Warna Sekunder" value={clinic.settings.theme.secondaryColor} onChange={(v) => updateSettings({ theme: { ...clinic.settings.theme, secondaryColor: v } })} />
          <ColorField label="Warna Gelap" value={clinic.settings.theme.darkColor} onChange={(v) => updateSettings({ theme: { ...clinic.settings.theme, darkColor: v } })} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Hero Halaman Klinik</h2>
        <div className="space-y-4">
          <div>
            <Label>Judul (kosongkan untuk pakai nama klinik)</Label>
            <Input value={clinic.settings.hero.title} onChange={(e) => updateSettings({ hero: { ...clinic.settings.hero, title: e.target.value } })} />
          </div>
          <div>
            <Label>Subjudul</Label>
            <Input value={clinic.settings.hero.subtitle} onChange={(e) => updateSettings({ hero: { ...clinic.settings.hero, subtitle: e.target.value } })} />
          </div>
          <div>
            <Label>Teks Tombol CTA</Label>
            <Input value={clinic.settings.hero.ctaText} onChange={(e) => updateSettings({ hero: { ...clinic.settings.hero, ctaText: e.target.value } })} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Foto Promo / Event</h2>
        <p className="text-sm text-dark/50 mb-4">Tampil di halaman publik klinik, cocok untuk info vaksinasi gratis, event kesehatan, promo baru, dan sejenisnya.</p>
        <div className="space-y-3 mb-4">
          {clinic.settings.gallery.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <Image src={item.imageBase64} alt={item.caption || "Foto"} width={56} height={56} unoptimized className="rounded-xl object-cover w-14 h-14 border border-dark/10 shrink-0" />
              <Input
                placeholder="Keterangan foto"
                value={item.caption}
                onChange={(e) => updateGalleryCaption(i, e.target.value)}
              />
              <button type="button" onClick={() => removeGalleryItem(i)} className="text-red-500 text-sm font-medium hover:underline cursor-pointer shrink-0">
                Hapus
              </button>
            </div>
          ))}
          {clinic.settings.gallery.length === 0 && <p className="text-dark/40 text-sm">Belum ada foto promo/event.</p>}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImage(e.target.files?.[0], addGalleryItem)}
          className="text-xs"
        />
      </Card>

      <Card>
        <h2 className="font-semibold text-dark mb-4">Kontak & Sosial Media</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input value={clinic.contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input value={clinic.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={clinic.contact.whatsapp} onChange={(e) => updateContact({ whatsapp: e.target.value })} />
          </div>
          <div>
            <Label>Alamat</Label>
            <Input value={clinic.contact.address} onChange={(e) => updateContact({ address: e.target.value })} />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={clinic.settings.socials.instagram} onChange={(e) => updateSettings({ socials: { ...clinic.settings.socials, instagram: e.target.value } })} />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={clinic.settings.socials.facebook} onChange={(e) => updateSettings({ socials: { ...clinic.settings.socials, facebook: e.target.value } })} />
          </div>
          <div>
            <Label>TikTok</Label>
            <Input value={clinic.settings.socials.tiktok} onChange={(e) => updateSettings({ socials: { ...clinic.settings.socials, tiktok: e.target.value } })} />
          </div>
        </div>
      </Card>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green text-sm">{message}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (f: File | undefined) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <Image src={value} alt={label} width={48} height={48} unoptimized className="rounded-xl object-cover w-12 h-12 border border-dark/10" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-bg border border-dark/10" />
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
