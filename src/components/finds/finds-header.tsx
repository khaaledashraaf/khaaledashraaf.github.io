"use client";

import { motion } from "framer-motion";
import { SubmitFindButton } from "./submit-find";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FindsHeader() {
  return (
    <motion.div
      className="flex flex-col gap-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item} className="text-2xl font-bold tracking-tight">
        Internet Finds
      </motion.h1>
      <motion.div variants={item} className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground">
          A gallery of things I&apos;ve found online that I think are worth sharing.
        </p>
        <SubmitFindButton />
      </motion.div>
    </motion.div>
  );
}
