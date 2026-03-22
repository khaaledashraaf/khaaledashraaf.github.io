"use client";

import { useEffect } from "react";
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
  ExternalLink,
  X,
} from "lucide-react";

const typeConfig: Record<
  Find["type"],
  { icon: React.FC<{ className?: string }>; label: string }
> = {
  movie: { icon: Film, label: "Movie" },
  book: { icon: BookOpen, label: "Book" },
  reel: { icon: Play, label: "Reel" },
  video: { icon: MonitorPlay, label: "Video" },
  poetry: { icon: FileText, label: "Poetry" },
  article: { icon: FileText, label: "Article" },
  music: { icon: Music, label: "Music" },
  image: { icon: ImageIcon, label: "Image" },
  tool: { icon: Wrench, label: "Tool" },
  people: { icon: User, label: "Person" },
  other: { icon: Sparkles, label: "Find" },
};

function getEmbedUrl(find: Find): string | null {
  if (find.coverVideoUrl) return find.coverVideoUrl;
  if (!find.sourceUrl) return null;

  const ytMatch = find.sourceUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;

  const vimeoMatch = find.sourceUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch)
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

  return null;
}

function getSpotifyEmbed(find: Find): string | null {
  if (!find.sourceUrl?.includes("spotify.com")) return null;
  return find.sourceUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
}

interface FindDetailOverlayProps {
  find: Find;
  allFinds: Find[];
  onClose: () => void;
}

export function FindDetailOverlay({
  find,
  allFinds,
  onClose,
}: FindDetailOverlayProps) {
  const { icon: TypeIcon, label: typeLabel } = typeConfig[find.type];
  const embedUrl = getEmbedUrl(find);
  const spotifyUrl = getSpotifyEmbed(find);
  const relatedFinds = allFinds
    .filter((f) => f.type === find.type && f.id !== find.id)
    .slice(0, 3);

  // Scroll lock
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" style={{ perspective: 1200 }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto",
          "rounded-2xl backdrop-blur-xl",
          "bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-white/[0.12] dark:via-white/[0.08] dark:to-white/[0.04]",
          "shadow-[0_24px_80px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(255,255,255,0.03)]",
          "border border-white/50 dark:border-white/[0.1]"
        )}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <X className="h-4 w-4" />
        </motion.button>

        {/* Media */}
        {find.imageUrl && !embedUrl && (
          <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
            <Image
              src={find.imageUrl}
              alt={find.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}
        {embedUrl && (
          <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen"
              title={find.title}
            />
          </div>
        )}

        {/* Content */}
        <motion.div
          className="p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <TypeIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {typeLabel}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">{find.title}</h2>
          {find.author && (
            <p className="text-muted-foreground mt-1">by {find.author}</p>
          )}

          <p className="mt-4 text-foreground/80 leading-relaxed">
            {find.expandedNote ?? find.note}
          </p>

          {find.excerpt && (
            <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 font-serif italic text-lg text-foreground/90 whitespace-pre-line">
              {find.excerpt}
            </blockquote>
          )}

          {spotifyUrl && (
            <div className="mt-6">
              <iframe
                src={spotifyUrl}
                className="w-full h-20 rounded-xl"
                allow="encrypted-media"
                title={`${find.title} on Spotify`}
              />
            </div>
          )}

          {find.sourceUrl && (
            <a
              href={find.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl text-sm font-medium",
                "bg-foreground text-background hover:bg-foreground/90 transition-colors"
              )}
            >
              Visit
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {relatedFinds.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/30">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Related finds
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedFinds.map((related) => (
                  <a
                    key={related.id}
                    href={related.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-sm text-foreground transition-colors"
                  >
                    {related.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
