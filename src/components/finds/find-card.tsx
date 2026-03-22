"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Find } from "@/content/finds";
import { cn } from "@/lib/utils";
import {
  Film,
  BookOpen,
  Play,
  MonitorPlay,
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

interface CardWrapperProps {
  find: Find;
  className?: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onInspect?: () => void;
}

function CardWrapper({ find, className, children, isSelected, onInspect }: CardWrapperProps) {
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
    isSelected && "invisible",
    className
  );

  const submittedByTag = find.submittedBy ? (
    <div className="px-4 pb-3 pt-0">
      <span className="text-xs text-muted-foreground/60">Submitted by {find.submittedBy}</span>
    </div>
  ) : null;

  if (isFeatured) {
    return (
      <motion.div
        onClick={onInspect}
        whileHover={{ y: -8 }}
        transition={{ type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={sharedClassName}
      >
        {children}
        {submittedByTag}
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
      {submittedByTag}
    </Comp>
  );
}

function PoetryCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect}>
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

function MovieCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className={cn("relative w-full overflow-hidden", find.priority === 3 ? "aspect-[3/5]" : "aspect-[2/3]")}>
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function BookCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="bg-amber-100/20 dark:bg-amber-500/[0.04] p-4">
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

function ReelCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function VideoCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black">
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MonitorPlay className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Video</span>
          {find.sourceUrl && (
            <span className="flex items-center gap-1 text-xs ml-auto">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814Z M9.545 15.568V8.432L15.818 12l-6.273 3.568Z" /></svg>
              {extractDomain(find.sourceUrl)}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-foreground">{find.title}</h3>
        {find.author && (
          <p className="text-sm text-muted-foreground">by {find.author}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground/80">{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function ArticleCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  const hasCover = find.coverVideoUrl || find.imageUrl;
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className={cn("overflow-hidden", !hasCover && "p-4")}>
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
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function MusicCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="bg-violet-100/20 dark:bg-violet-500/[0.04] p-4">
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

function ImageCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="overflow-hidden">
      {find.imageUrl && (
        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function ToolCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="bg-emerald-100/20 dark:bg-emerald-500/[0.04] overflow-hidden">
      {find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function PeopleCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  const hasCover = find.imageUrl;
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className={cn("overflow-hidden", !hasCover && "p-4")}>
      {find.imageUrl && (
        <div className={cn("relative w-full overflow-hidden", find.priority === 3 ? "aspect-[3/2]" : "aspect-video")}>
          <Image
            src={find.imageUrl}
            alt={find.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500"
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

function OtherCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const s = getPriority(find);
  return (
    <CardWrapper find={find} isSelected={isSelected} onInspect={onInspect} className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Find</span>
      </div>
      <h3 className={cn("font-semibold text-foreground", s.title)}>{find.title}</h3>
      <p className={cn("mt-2 text-muted-foreground/80", s.body)}>{find.note}</p>
    </CardWrapper>
  );
}

const cardMap: Record<Find["type"], React.ComponentType<{ find: Find; isSelected?: boolean; onInspect?: () => void }>> = {
  movie: MovieCard,
  book: BookCard,
  reel: ReelCard,
  video: VideoCard,
  poetry: PoetryCard,
  article: ArticleCard,
  music: MusicCard,
  image: ImageCard,
  tool: ToolCard,
  people: PeopleCard,
  other: OtherCard,
};

export function FindCard({ find, isSelected, onInspect }: { find: Find; isSelected?: boolean; onInspect?: () => void }) {
  const Card = cardMap[find.type];
  return <Card find={find} isSelected={isSelected} onInspect={onInspect} />;
}
