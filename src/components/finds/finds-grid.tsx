"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Find, FindType } from "@/content/finds";
import { FindCard, type CardRect } from "./find-card";
import { FindDetailOverlay } from "./find-detail";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  List,
  Film,
  BookOpen,
  Play,
  FileText,
  Music,
  ImageIcon,
  Sparkles,
  Wrench,
  PenLine,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const typeLabels: Record<FindType, string> = {
  movie: "Movies",
  book: "Books",
  reel: "Videos",
  poetry: "Poetry",
  article: "Articles",
  music: "Music",
  image: "Images",
  tool: "Tools",
  people: "People",
  other: "Other",
};

const typeIcons: Record<FindType, React.FC<{ className?: string }>> = {
  movie: Film,
  book: BookOpen,
  reel: Play,
  poetry: PenLine,
  article: FileText,
  music: Music,
  image: ImageIcon,
  tool: Wrench,
  people: User,
  other: Sparkles,
};

interface FindsGridProps {
  finds: Find[];
  types: FindType[];
}

type ViewMode = "grid" | "list";

function FindListItem({ find }: { find: Find }) {
  const Comp = find.sourceUrl ? "a" : "div";
  const Icon = typeIcons[find.type];
  return (
    <Comp
      {...(find.sourceUrl
        ? { href: find.sourceUrl, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="group flex items-start gap-4 py-3 border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
    >
      <Icon className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-foreground group-hover:underline truncate">
            {find.title}
          </h3>
          {find.author && (
            <span className="text-sm text-muted-foreground shrink-0">
              by {find.author}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{find.note}</p>
      </div>
      <span className="text-xs text-muted-foreground/60 shrink-0 mt-1">
        {typeLabels[find.type].replace(/s$/, "")}
      </span>
    </Comp>
  );
}

export function FindsGrid({ finds, types }: FindsGridProps) {
  const [activeType, setActiveType] = useState<FindType | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedFind, setSelectedFind] = useState<Find | null>(null);
  const [selectedRect, setSelectedRect] = useState<CardRect | null>(null);

  const filtered = activeType
    ? finds.filter((f) => f.type === activeType)
    : finds;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setActiveType(null)}>
            <Badge variant={activeType === null ? "default" : "outline"}>
              All
            </Badge>
          </button>
          {types.map((type) => (
            <button key={type} onClick={() => setActiveType(type)}>
              <Badge variant={activeType === type ? "default" : "outline"}>
                {typeLabels[type]}
              </Badge>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5 bg-white dark:bg-black">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {view === "grid" ? (
        <motion.div
          key={`grid-${activeType ?? "all"}`}
          className="columns-1 sm:columns-2 lg:columns-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filtered.map((find) => (
            <motion.div
              key={find.id}
              variants={item}
            >
              <FindCard
                find={find}
                onInspect={find.featured ? (rect) => { setSelectedRect(rect); setSelectedFind(find); } : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key={`list-${activeType ?? "all"}`}
          className="flex flex-col"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filtered.map((find) => (
            <motion.div key={find.id} variants={item}>
              <FindListItem find={find} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && (
        <p className="text-muted-foreground">No finds yet in this category.</p>
      )}

      <AnimatePresence>
        {selectedFind && selectedRect && (
          <FindDetailOverlay
            find={selectedFind}
            allFinds={finds}
            originRect={selectedRect}
            onClose={() => { setSelectedFind(null); setSelectedRect(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
