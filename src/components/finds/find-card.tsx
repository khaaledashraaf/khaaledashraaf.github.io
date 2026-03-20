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
} from "lucide-react";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function CardWrapper({
  find,
  className,
  children,
}: {
  find: Find;
  className?: string;
  children: React.ReactNode;
}) {
  const Comp = find.sourceUrl ? "a" : "div";
  return (
    <Comp
      {...(find.sourceUrl
        ? { href: find.sourceUrl, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "group block break-inside-avoid mb-4 transition-transform duration-200 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </Comp>
  );
}

function PoetryCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find}>
      <div className="border-l-2 border-primary/40 pl-5 py-2">
        {find.excerpt && (
          <p className="font-serif text-lg italic leading-relaxed text-foreground whitespace-pre-line">
            {find.excerpt}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          — {find.author ?? find.title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground/70">{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function MovieCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl overflow-hidden bg-muted/40 border border-border/50">
      {find.imageUrl && (
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Film className="h-3.5 w-3.5" />
          <span className="text-xs uppercase tracking-wider">Movie</span>
        </div>
        <h3 className="font-semibold text-foreground">{find.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{find.note}</p>
      </div>
    </CardWrapper>
  );
}

function BookCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/20 p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <BookOpen className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Book</span>
      </div>
      <h3 className="font-semibold text-foreground">{find.title}</h3>
      {find.author && (
        <p className="text-sm text-muted-foreground">by {find.author}</p>
      )}
      <p className="mt-2 text-sm text-muted-foreground/80">{find.note}</p>
    </CardWrapper>
  );
}

function ReelCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl overflow-hidden bg-muted/40 border border-border/50">
      {find.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

function ArticleCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl border border-border/50 p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <FileText className="h-3.5 w-3.5" />
        {find.sourceUrl && (
          <span className="text-xs">{extractDomain(find.sourceUrl)}</span>
        )}
      </div>
      <h3 className="font-semibold text-foreground group-hover:underline">
        {find.title}
      </h3>
      {find.author && (
        <p className="text-sm text-muted-foreground">by {find.author}</p>
      )}
      <p className="mt-2 text-sm text-muted-foreground/80">{find.note}</p>
    </CardWrapper>
  );
}

function MusicCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/10 dark:to-fuchsia-950/10 border border-violet-200/30 dark:border-violet-800/20 p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Music className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Music</span>
      </div>
      <h3 className="font-semibold text-foreground">{find.title}</h3>
      {find.author && (
        <p className="text-sm text-muted-foreground">by {find.author}</p>
      )}
      <p className="mt-2 text-sm text-muted-foreground/80">{find.note}</p>
    </CardWrapper>
  );
}

function ImageCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl overflow-hidden">
      {find.imageUrl && (
        <div className="relative w-full overflow-hidden">
          <img
            src={find.imageUrl}
            alt={find.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

function OtherCard({ find }: { find: Find }) {
  return (
    <CardWrapper find={find} className="rounded-xl border border-border/50 bg-muted/30 p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">Find</span>
      </div>
      <h3 className="font-semibold text-foreground">{find.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground/80">{find.note}</p>
    </CardWrapper>
  );
}

const cardMap: Record<Find["type"], React.FC<{ find: Find }>> = {
  movie: MovieCard,
  book: BookCard,
  reel: ReelCard,
  poetry: PoetryCard,
  article: ArticleCard,
  music: MusicCard,
  image: ImageCard,
  other: OtherCard,
};

export function FindCard({ find }: { find: Find }) {
  const Card = cardMap[find.type];
  return <Card find={find} />;
}
