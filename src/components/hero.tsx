import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const currentTools = [
  { label: "Figma", color: "bg-[#a259ff]/10 text-[#a259ff] hover:bg-[#a259ff]/20" },
  { label: "Claude Code", color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" },
  { label: "Cursor", color: "bg-foreground/10 text-foreground hover:bg-foreground/20" },
  { label: "Next.js", color: "bg-foreground/10 text-foreground hover:bg-foreground/20" },
  { label: "Tailwind", color: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20" },
  { label: "Framer Motion", color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20" },
];

const previousTools = [
  { label: "OpenGL", color: "bg-sky-600/10 text-sky-600 hover:bg-sky-600/20" },
  { label: "Laravel", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
  { label: "Lottie", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  { label: "Bootstrap", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
];

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/header.svg"
          alt="Khaled Ashraf"
          width={549}
          height={84}
          priority
          className="dark:invert w-full max-w-[550px]"
        />
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base text-center">
          Product Designer with a background in Computer Engineering.
          <br />
          Building at the intersection of design tools and code.
        </p>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Currently at <a href="https://www.linkedin.com/company/nooncom/"><span className="font-semibold text-foreground hover:underline">noon</span></a> — improving how
        designers and engineers collaborate.
      </p>

      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Working with
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {currentTools.map((tool) => (
            <Badge key={tool.label} variant="secondary" className={tool.color}>
              {tool.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Previously
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {previousTools.map((tool) => (
            <Badge key={tool.label} variant="secondary" className={tool.color}>
              {tool.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
