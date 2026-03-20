"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Find, FindType } from "@/content/finds";
import { FindCard } from "./find-card";
import { Badge } from "@/components/ui/badge";

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
  other: "Other",
};

interface FindsGridProps {
  finds: Find[];
  types: FindType[];
}

export function FindsGrid({ finds, types }: FindsGridProps) {
  const [activeType, setActiveType] = useState<FindType | null>(null);

  const filtered = activeType
    ? finds.filter((f) => f.type === activeType)
    : finds;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
      </motion.div>

      <motion.div
        key={activeType ?? "all"}
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filtered.map((find) => (
          <motion.div key={find.id} variants={item}>
            <FindCard find={find} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">No finds yet in this category.</p>
      )}
    </div>
  );
}
