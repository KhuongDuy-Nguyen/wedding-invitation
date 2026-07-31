import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { withBasePath } from "./asset-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duy & Lan | Thiệp cưới",
  description:
    "Trân trọng mời bạn đến chung vui trong ngày thành hôn của Duy và Lan.",
  applicationName: "Thiệp cưới Duy & Lan",
  authors: [{ name: "Duy & Lan" }],
  formatDetection: { email: false, address: false, telephone: false },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: withBasePath("/favicon.png?v=5"), type: "image/png", sizes: "192x192" }],
    shortcut: withBasePath("/favicon.png?v=5"),
    apple: withBasePath("/images/logo/apple-touch-icon.png?v=3"),
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f2e8",
  colorScheme: "light",
};

const rootAssetStyles = {
  "--botanical-frame-image": `url("${withBasePath("/images/decor/botanical-frame.webp")}")`,
  "--gallery-portrait-image": `url("${withBasePath("/images/01-ROZ02408.JPG")}")`,
  "--gallery-landscape-image": `url("${withBasePath("/images/02-ROZ01985.JPG")}")`,
} as CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" style={rootAssetStyles}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fonts are shared by the root App Router layout and load once for the site. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
