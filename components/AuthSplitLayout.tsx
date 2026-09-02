import Image from "next/image";
import { ReactNode } from "react";

export default function AuthSplitLayout({
  imageBase64,
  siteName,
  tagline,
  children,
}: {
  imageBase64?: string;
  siteName: string;
  tagline?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 grid lg:grid-cols-2">
      <div className="relative hidden lg:flex items-end p-12 overflow-hidden bg-linear-to-br from-dark to-green">
        {imageBase64 && (
          <Image src={imageBase64} alt={siteName} fill unoptimized priority className="object-cover" />
        )}
        <div className="relative z-10 text-white">
          <p className="text-2xl font-bold mb-2">{siteName}</p>
          {tagline && <p className="text-white/80 max-w-sm leading-relaxed">{tagline}</p>}
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-dark/70 via-dark/10 to-transparent" />
      </div>
      <div className="flex items-center justify-center p-6">{children}</div>
    </main>
  );
}
