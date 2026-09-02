import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// Google Fonts kini menyajikan "Fredoka One" sebagai bagian dari keluarga variable "Fredoka"
// (weight 500/600 setara Fredoka One). next/font/google tidak lagi expose "Fredoka_One" terpisah.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KlinikKita",
  description: "Platform Manajemen Klinik Multi-Cabang",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-dark">{children}</body>
    </html>
  );
}
