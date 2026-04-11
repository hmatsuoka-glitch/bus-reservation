import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563EB",
};

export const metadata: Metadata = {
  title: "BusPass - 高速バス予約管理",
  description: "高速バスの予約・搭乗券・QRコード・乗り場を一元管理",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BusPass",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="font-sans">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
