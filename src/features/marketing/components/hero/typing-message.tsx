"use client";

import { motion } from "framer-motion";

export function TypingMessage({ text, active }: { text: string; active: boolean }) {
  const characters = text.split("");

  return (
    <span aria-label={text} className="inline-flex min-h-5 flex-wrap">
      {characters.map((character, index) => (
        <motion.span
          aria-hidden
          key={`${character}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ delay: active ? index * 0.018 : 0, duration: 0.12 }}
        >
          {character === " " ? "\u00A0" : character}
        </motion.span>
      ))}
    </span>
  );
}
