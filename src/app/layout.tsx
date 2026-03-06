import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
    url: "https://khaaledashraaf.github.io",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-3xl px-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
