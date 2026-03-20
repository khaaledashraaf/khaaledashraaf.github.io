import type { Metadata } from "next";
import { SeaReel } from "@/components/sea-reel";
import { AboutContent } from "@/components/about-content";

export const metadata: Metadata = {
  title: "About",
  description: "About Khaled Ashraf — Product Designer and Computer Engineer.",
};

export default function AboutPage() {
  return (
    <>
      <SeaReel />
      <AboutContent />
    </>
  );
}
