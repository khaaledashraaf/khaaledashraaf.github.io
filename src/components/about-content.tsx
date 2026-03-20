"use client";

import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.6,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const sentences = [
  "25 years old from Alexandria, Egypt.",
  "I studied computer engineering but I realized my passion was to create, design, and explore the world, so I shifted to product design.",
  "Now I\u2019m back a full circle, bridging design and code to produce beautiful and functional products.",
];

const sentences2 = [
  <>
    I believe that being a <strong>human </strong> is the most beautiful thing in
    the world.
  </>,
  "I long to feelings, love, pain, and everything in between.",
  "In the weird times that we live in, I realized that it\u2019s more important than ever to explore what being a human is, and that\u2019s what I do these days.",
];

export function AboutContent() {
  return (
    <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center sm:pb-30">
      <motion.video
        src="/heart.webm"
        autoPlay
        loop
        muted
        playsInline
        className="w-20 h-20 object-cover object-center invert"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="text-white/80 text-lg leading-relaxed text-justify sm:max-w-lg"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {sentences.map((sentence, i) => (
          <motion.span key={i} variants={item}>
            {sentence}{" "}
          </motion.span>
        ))}
        <motion.span variants={item}>
          <br />
          <br />
        </motion.span>
        {sentences2.map((sentence, i) => (
          <motion.span key={i} variants={item}>
            {sentence}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
