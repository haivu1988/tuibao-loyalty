import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TUIBAO · Trà sữa tích điểm",
  description: "Tích tick – đổi quà cho tín đồ trà sữa TUIBAO 🧋",
  icons: { icon: "/tuibao-logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3d8a24",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen text-slate-900 antialiased">{children}</body>
    </html>
  );
}
