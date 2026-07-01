"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function AnimatedAmount({ value, active }: { value: number; active: boolean }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 22, mass: 0.7 });
  const display = useTransform(spring, (latest) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(latest),
  );

  useEffect(() => {
    motionValue.set(active ? value : 0);
  }, [active, motionValue, value]);

  return <motion.span>{display}</motion.span>;
}

export function EstimateLine({
  name,
  amount,
  visible,
}: {
  name: string;
  amount: number;
  visible: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/7 bg-white/[0.045] px-3 py-2"
    >
      <span className="truncate text-[11px] text-slate-200">{name}</span>
      <span className="text-[11px] font-semibold text-white">
        <AnimatedAmount value={amount} active={visible} />
      </span>
    </motion.div>
  );
}
