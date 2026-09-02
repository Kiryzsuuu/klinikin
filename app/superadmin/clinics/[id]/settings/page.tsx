"use client";

import { use } from "react";
import Link from "next/link";
import ClinicSettingsForm from "@/components/ClinicSettingsForm";

type DetailResponse = { clinic: unknown };

export default function SuperAdminClinicSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/superadmin/clinics/${id}`} className="text-sm text-dark/50 hover:underline">
          Kembali ke detail klinik
        </Link>
        <h1 className="text-2xl font-semibold text-dark mt-1">Site Settings Klinik</h1>
        <p className="text-dark/60">Diedit oleh Super Admin atas nama klinik ini.</p>
      </div>
      <ClinicSettingsForm
        getUrl={`/api/superadmin/clinics/${id}`}
        putUrl={`/api/superadmin/clinics/${id}/settings`}
        extractClinic={(data) => (data as DetailResponse).clinic as never}
      />
    </div>
  );
}
