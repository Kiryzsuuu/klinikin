"use client";

import ClinicSettingsForm from "@/components/ClinicSettingsForm";

export default function ClinicSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark">Site Settings Klinik</h1>
        <p className="text-dark/60">Kustomisasi tampilan halaman publik klinik Anda (booking, foto promo, dll).</p>
      </div>
      <ClinicSettingsForm getUrl="/api/clinic-settings" putUrl="/api/clinic-settings" />
    </div>
  );
}
