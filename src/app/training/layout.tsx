import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Training",
  description: "Full-body 3-day workout tracker",
  manifest: "/training-manifest.json",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Training",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/training-192.png",
    apple: "/icons/training-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
