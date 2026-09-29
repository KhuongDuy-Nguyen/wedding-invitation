import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { withBasePath } from "./asset-path";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://khuongduy-nguyen.github.io/wedding-invitation/"),
  title: "Duy & Lan | Thiệp cưới",
  description:
    "Trân trọng mời bạn đến chung vui trong ngày thành hôn của Duy và Lan - 28.10.2026 tại Diamond Place.",
  applicationName: "Thiệp cưới Duy & Lan",
  authors: [{ name: "Duy & Lan" }],
  formatDetection: { email: false, address: false, telephone: false },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: withBasePath("/favicon.png?v=5"), type: "image/png", sizes: "192x192" }],
    shortcut: withBasePath("/favicon.png?v=5"),
    apple: withBasePath("/images/logo/apple-touch-icon.png?v=3"),
  },
  openGraph: {
    title: "Duy & Lan | Thiệp cưới · 28.10.2026",
    description:
      "Trân trọng kính mời bạn đến chung vui trong ngày thành hôn của Duy và Lan tại Diamond Place, TP. HCM.",
    siteName: "Thiệp cưới Duy & Lan",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: withBasePath("/images/01-ROZ02396.webp"),
        width: 1200,
        height: 1800,
        alt: "Ảnh cưới Duy & Lan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duy & Lan | Thiệp cưới · 28.10.2026",
    description:
      "Trân trọng kính mời bạn đến chung vui trong ngày thành hôn của Duy và Lan tại Diamond Place, TP. HCM.",
    images: [withBasePath("/images/01-ROZ02396.webp")],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e8" },
    { media: "(prefers-color-scheme: dark)", color: "#171b14" },
  ],
  colorScheme: "light dark",
};

const themeInitializer = `
  try {
    const savedTheme = localStorage.getItem("wedding-theme");
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

const rootAssetStyles = {
  "--botanical-frame-image": `url("${withBasePath("/images/decor/botanical-frame.webp")}")`,
  "--gallery-portrait-image": `url("${withBasePath("/images/01-ROZ02396.webp")}")`,
  "--gallery-landscape-image": `url("${withBasePath("/images/02-ROZ01986.webp")}")`,
} as CSSProperties;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" style={rootAssetStyles} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fonts are shared by the root App Router layout and load once for the site. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&display=swap"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
