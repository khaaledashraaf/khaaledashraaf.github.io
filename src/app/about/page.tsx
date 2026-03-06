import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Khaled Ashraf — Product Designer and Computer Engineer.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-2xl font-bold tracking-tight">About</h1>
      <div className="flex flex-col gap-4 text-muted-foreground">
        <p>
          Product Designer with a background in Computer Engineering, currently
          working at <span className="font-medium text-foreground">noon</span>.
        </p>
        <p>
          I focus on improving how designers and engineers collaborate — building
          tools and workflows at the intersection of design and code.
        </p>
        <p>
          Previously worked with OpenGL, Laravel, Lottie, and Bootstrap before
          moving into product design and modern web tooling.
        </p>
      </div>
    </div>
  );
}
