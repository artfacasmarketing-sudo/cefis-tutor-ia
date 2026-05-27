import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEFIS Tutor IA",
  description: "O tutor que assistiu todas as 7.447 aulas que você paga na CEFIS, leu seus certificados, e te chama pelo nome.",
  openGraph: {
    title: "CEFIS Tutor IA",
    description: "O tutor que assistiu todas as 7.447 aulas que você paga na CEFIS, leu seus certificados, e te chama pelo nome.",
    url: "https://cefis-tutor-ia.vercel.app",
    siteName: "CEFIS Tutor IA",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CEFIS Tutor IA",
    description: "O tutor que assistiu todas as 7.447 aulas que você paga na CEFIS.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="bg-[#020617] text-white antialiased min-h-screen flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
