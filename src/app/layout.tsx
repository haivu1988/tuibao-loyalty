import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TUIBAO · Trà sữa tích điểm",
  description: "Tích tick – đổi quà cho tín đồ trà sữa TUIBAO 🧋",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3d8a24",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Font Be Vietnam Pro — nạp qua link nên build không phụ thuộc mạng.
            Nếu không tải được, tự rơi về font hệ thống. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-display text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
