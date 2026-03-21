"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { Find } from "@/content/finds";
import { cn } from "@/lib/utils";
import {
  Film,
  BookOpen,
  Play,
  FileText,
  Music,
  ImageIcon,
  Sparkles,
  Wrench,
  User,
} from "lucide-react";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

const priorityText: Record<number, { title: string; body: string }> = {
  1: { title: "text-base", body: "text-sm" },
  2: { title: "text-lg", body: "text-base" },
  3: { title: "text-xl", body: "text-base" },
};

function getPriority(find: Find) {
  return priorityText[find.priority ?? 1];
}

export interface CardRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CardWrapperProps {
  find: Find;
  className?: string;
  children: React.ReactNode;
  onInspect?: (rect: CardRect) => void;
}

function CardWrapper({ find, className, children, onInspect }: CardWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const p = find.priority ?? 1;
  const isFeatured = find.featured && onInspect;

  const sharedClassName = cn(
    "group relative block break-inside-avoid mb-4",
    "rounded-2xl backdrop-blur-xl",
    "bg-gradient-to-br from-white/60 via-white/40 to-white/20 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.01]",
    "shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(255,255,255,0.02)]",
    "border border-white/40 dark:border-white/[0.08]",
    "hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.03)]",
    p === 3 && "column-span-all",
    isFeatured && "cursor-pointer",
    className
  );

  if (isFeatured) {
    const handleClick = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      onInspect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    return (
      <motion.div
        ref={ref}
        onClick={handleClick}
        whileHover={{ y: -8 }}
        transition={{ type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={sharedClassName}
      >
        {children}
      </motion.div>
    );
  }

  const Comp = find.sourceUrl ? motion.a : motion.div;
  return (
    <Comp
      {...(find.sourceUrl
        ? { href: find.sourceUrl, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      whileHover={{ y: -8 }}
      transition={{ type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={sharedClassName}
    >
      {children}
    </Comp>
  );
}

function PoetryCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect}>
      <div className="border-l-2 border-primary/40 pl-5 py-2">
        {find.excerpt && (
          <p className={cn("font-serif italic leading-relaxed text-foreground whitespace-pre-line", find.priority === 3 ? "text-2xl" : find.priority === 2 ? "text-xl" : "text-lg")}>
            {find.excerpt}
          </p>
        )}
        <p className={cn("mt-3 text-muted-foreground", s.body)}>
          — {find.author ?? find.title}
        </p>
        <p className={cn("mt-2 text-muted-foreground/70", s.body)}>{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function MovieCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className={cn("relative w-full overflow-hidden", find.priority === 3 ? "aspect-[3/5]" : "aspect-[2/3]")}>
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Film className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Movie</span>
        </div>
        <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
        <p className={cn("mt-1 text-muted-foreground", s.body)}>{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function BookCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect} className="bg-amber-100/20 dark:bg-amber-500/[0.04] p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <BookOpen className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Book</span>
      </div>
      <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
      {find.author && (
        <p className={cn("text-muted-foreground", s.body)}>by {find.author}</p>
      )}
      <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
    </CardWrapper>
  );
}

function ReelCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  return (
    <CardWrapper find={find} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black">
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-foreground">{find.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function ArticleCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  const hasCover = find.coverVideoUrl || find.imageUrl;
  return (
    <CardWrapper find={find} onInspect={onInspect} className={cn("overflow-hidden", !hasCover && "p-4")}>
      {find.coverVideoUrl && (
        <div className={cn("relative w-full overflow-hidden", find.priority === 3 ? "aspect-[3/4]" : "aspect-video")}>
          <iframe
            src={find.coverVideoUrl}
            className="absolute inset-0 h-full w-full scale-[1.5] pointer-events-none"
            allow="autoplay"
            title={find.title}
          />
        </div>
      )}
      {!find.coverVideoUrl && find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
        </div>
      )}
      <div className={hasCover ? "p-4" : ""}>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Article</span>
          {find.sourceUrl && (
            <span className="text-xs ml-auto">{extractDomain(find.sourceUrl)}</span>
          )}
        </div>
        <h3 className={cn("font-semibold text-foreground group-hover:underline", s.title)}>
          {find.title}
        </h3>
        {find.author && (
          <p className={cn("text-muted-foreground", s.body)}>by {find.author}</p>
        )}
        <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function MusicCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect} className="bg-violet-100/20 dark:bg-violet-500/[0.04] p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Music className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Music</span>
      </div>
      <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
      {find.author && (
        <p className={cn("text-muted-foreground", s.body)}>by {find.author}</p>
      )}
      <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
    </CardWrapper>
  );
}

function ImageCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  return (
    <CardWrapper find={find} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className="relative w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
            <h3 className="font-semibold text-white">{find.title}</h3>
            <p className="mt-1 text-sm text-white/80">{find.note}</p>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}

function ToolCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect} className="bg-emerald-100/20 dark:bg-emerald-500/[0.04] overflow-hidden">
      {find.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Wrench className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Tool</span>
          {find.sourceUrl && (
            <span className="text-xs ml-auto">{extractDomain(find.sourceUrl)}</span>
          )}
        </div>
        <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
        <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function PeopleCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  const hasCover = find.imageUrl;
  return (
    <CardWrapper find={find} onInspect={onInspect} className={cn("overflow-hidden", !hasCover && "p-4")}>
      {find.imageUrl && (
        <div className={cn("relative w-full overflow-hidden", find.priority === 3 ? "aspect-[3/2]" : "aspect-video")}>
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <User className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Person</span>
        </div>
        <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
        <p className={cn("mt-1 text-muted-foreground", s.body)}>{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function OtherCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} onInspect={onInspect} className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Find</span>
      </div>
      <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
      <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
    </CardWrapper>
  );
}

const cardMap: Record<Find["type"], React.FC<{ find: Find; onInspect?: (rect: CardRect) => void }>> = {
  movie: MovieCard,
  book: BookCard,
  reel: ReelCard,
  poetry: PoetryCard,
  article: ArticleCard,
  music: MusicCard,
  image: ImageCard,
  tool: ToolCard,
  people: PeopleCard,
  other: OtherCard,
};

export function FindCard({ find, onInspect }: { find: Find; onInspect?: (rect: CardRect) => void }) {
  const Card = cardMap[find.type];
  return <Card find={find} onInspect={onInspect} />;
}
