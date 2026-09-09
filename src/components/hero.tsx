import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { EmailCTA } from "@/components/email-cta";

const currentTools = [
  { label: "Figma", color: "bg-[#a259ff]/10 text-[#a259ff] hover:bg-[#a259ff]/20", href: "https://figma.com" },
  { label: "Figma MCP", color: "bg-[#a259ff]/10 text-[#a259ff] hover:bg-[#a259ff]/20", href: "https://www.figma.com/mcp-catalog/" },
  { label: "Claude Code", color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20", href: "https://claude.ai" },
  { label: "Cursor", color: "bg-foreground/10 text-foreground hover:bg-foreground/20", href: "https://cursor.com" },
  { label: "Next.js", color: "bg-foreground/10 text-foreground hover:bg-foreground/20", href: "https://nextjs.org" },
  { label: "Tailwind", color: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20", href: "https://tailwindcss.com" },
  { label: "Framer Motion", color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20", href: "https://motion.dev" },
  { label: "Lottie", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20", href: "https://lottiefiles.com" },
];

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-8 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-4">
        <h1 className="sr-only">Khaled Ashraf</h1>
        <Image
          src="/svg/header.svg"
          alt=""
          width={549}
          height={84}
          priority
          className="dark:invert w-full max-w-[550px] hidden md:block"
        />
        <Image
          src="/svg/header-mobile.svg"
          alt=""
          width={270}
          height={230}
          priority
          className="dark:invert w-full max-w-[270px] block md:hidden"
        />
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base text-center max-w-sm">
          Product Builder.
          <br />
          Currently at <a href="https://noon.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center align-baseline rounded-full border px-2 py-1 translate-y-[2px] bg-[#FEEE00] hover:bg-[#FEEE00]/80 transition-colors"><Image src="/noon-logo.svg" alt="noon" width={48} height={13} className="" /></a> building at the intersection of design tools and code.
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Working with
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {currentTools.map((tool) => (
            <a key={tool.label} href={tool.href} target="_blank" rel="noopener noreferrer">
              <Badge variant="secondary" className={tool.color}>
                {tool.label}
              </Badge>
            </a>
          ))}
        </div>
      </div>

      <EmailCTA />

      
    </section>
  );
}
