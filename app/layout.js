import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import TidioChat from "./components/TidioChat";
import MetaPixel from "./components/MetaPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://parhlopakistan.com.pk";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Parhlo Pakistan — Modern Online Learning & Test Prep",
    template: "%s | Parhlo Pakistan",
  },
  description: "Premier EdTech platform empowering students across Pakistan with MDCAT, ECAT, Matric, Intermediate & Skills courses.",
  icons: {
    icon: "/icon.png", 
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Parhlo Pakistan — Modern Online Learning & Test Prep",
    description: "Premier EdTech platform empowering students across Pakistan with MDCAT, ECAT, Matric, Intermediate & Skills courses.",
    url: siteUrl,
    siteName: "Parhlo Pakistan",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Parhlo Pakistan — Your Journey to Smarter Learning",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Parhlo Pakistan — Modern Online Learning & Test Prep",
    description: "Premier EdTech platform empowering students across Pakistan with MDCAT, ECAT, Matric, Intermediate & Skills courses.",
    images: ["/og-image.jpg"],
  },
  other: {
    "google-adsense-account": "ca-pub-7315986629947930",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-7315986629947930" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7315986629947930"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <SpeedInsights />
        <Analytics />
        <TidioChat />
        <MetaPixel />
      </body>
    </html>
  );
}