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
      {/* Hero — cascade only */}
      {/* <div className="relative z-10 min-h-screen w-full">
        <p className="absolute top-[20%] right-[100%] text-white text-4xl font-semibold [font-family:var(--font-lora)]">Human</p>
        <p className="absolute top-[30%] right-[75%] text-white/90 text-xl font-semibold">i love the sea,</p>
        <p className="absolute top-[40%] right-[50%] text-white/90 text-xl font-semibold">the sky,</p>
        <p className="absolute top-[50%] right-[25%] text-white/90 text-xl font-semibold">the trees,</p>
        <p className="absolute top-[60%] right-[0%] text-white/90 text-xl font-semibold">i love life</p>
      </div> */}

      {/* Bio — below the fold */}
      <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center sm:pb-30">
        <p className="text-white/90 text-lg leading-relaxed text-justify sm:max-w-lg">
          25 years old from Alexandria, Egypt. I studied computer engineering but I realized my passion was to create, design, and explore the world, so I shifted to product design.
          I believe that being a human is the most beautiful thing in the world.
          You have the ability to love, to feel, to create, to destroy, to learn, to grow, to change, to evolve.
          Most people go around their life without realizing how special being a human is.
          Not long ago, I realized that my mission was to live and experience life to the fullest.
          I long to feelings, love, pain, and everything in between.
          In the weird times that we live in, I realized that it&apos;s more important than ever to explore
          what being a human is.
        </p>
      </div>
    </>
  );
}
