"use client";

import { motion } from "framer-motion";

export function ProgressIndicator({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 via-sky-300 to-violet-300"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
