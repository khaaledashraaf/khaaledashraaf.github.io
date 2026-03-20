import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { SiteChrome } from "@/components/site-chrome";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Khaled Ashraf",
    template: "%s — Khaled Ashraf",
  },
  description:
    "Product Designer with a background in Computer Engineering. Building at the intersection of design tools and code.",
  openGraph: {
    title: "Khaled Ashraf",
    description:
      "Product Designer with a background in Computer Engineering. Building at the intersection of design tools and code.",
    url: "https://khaledashraf.me",
    siteName: "Khaled Ashraf",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khaled Ashraf",
    description:
      "Product Designer with a background in Computer Engineering. Building at the intersection of design tools and code.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Navbar />
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-LCV0P4FHDY" />
      </body>
    </html>
  );
}
