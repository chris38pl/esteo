"use client";

import { motion } from "framer-motion";

import type { EstimateSectionData } from "@/features/marketing/components/hero/hero-animation-data";
import { EstimateLine } from "@/features/marketing/components/hero/estimate-line";

export function EstimateSection({
  section,
  sectionVisible,
  visibleLineCount,
}: {
  section: EstimateSectionData;
  sectionVisible: boolean;
  visibleLineCount: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: sectionVisible ? 1 : 0, y: sectionVisible ? 0 : 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
          {section.title}
        </p>
        <span className="h-px flex-1 bg-white/10 ml-3" />
      </div>
      <div className="space-y-1.5">
        {section.lines.map((line, index) => (
          <EstimateLine
            key={line.id}
            name={line.name}
            amount={line.amount}
            visible={sectionVisible && index < visibleLineCount}
          />
        ))}
      </div>
    </motion.div>
  );
}
