"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function SummaryAmount({ value, active }: { value: number; active: boolean }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 70, damping: 20, mass: 0.8 });
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

export function EstimateSummary({
  net,
  vat,
  gross,
  labels,
  visible,
}: {
  net: number;
  vat: number;
  gross: number;
  labels: {
    net: string;
    vat: string;
    gross: string;
  };
  visible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-blue-300/15 bg-blue-400/10 p-3 shadow-[0_0_24px_rgba(96,165,250,0.12)]"
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <SummaryCell label={labels.net} value={net} active={visible} />
        <SummaryCell label={labels.vat} value={vat} active={visible} />
        <SummaryCell label={labels.gross} value={gross} active={visible} emphasized />
      </div>
    </motion.div>
  );
}

function SummaryCell({
  label,
  value,
  active,
  emphasized = false,
}: {
  label: string;
  value: number;
  active: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p
        className={
          emphasized ? "text-sm font-bold text-white" : "text-xs font-semibold text-slate-200"
        }
      >
        <SummaryAmount value={value} active={active} />
      </p>
    </div>
  );
}
