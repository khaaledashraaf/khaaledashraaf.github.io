import type { Metadata } from "next";
import { SeaReel } from "@/components/sea-reel";

export const metadata: Metadata = {
  title: "About",
  description: "About Khaled Ashraf — Product Designer and Computer Engineer.",
};

export default function AboutPage() {
  return (
    <>
      <SeaReel />
      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center sm:pb-30">
        <p className="text-white/90 text-lg leading-relaxed text-justify sm:max-w-lg">
          25 years old from Alexandria, Egypt. I studied computer engineering but I realized my passion was to create, design, and explore the world, so I shifted to product design. Now I'm back a full circle, bridging design and code to produce beautiful and functional products. <br/><br/>

          I believe that being a human is the most beautiful thing in the world.
          I long to feelings, love, pain, and everything in between.
          In the weird times that we live in, I realized that it&apos;s more important than ever to explore what being a human is, and that's what I do these days.
        </p>
      </div>
    </>
  );
}
