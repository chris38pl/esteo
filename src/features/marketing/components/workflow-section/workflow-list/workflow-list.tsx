"use client";

import { motion } from "framer-motion";

import type { WorkflowStep as WorkflowStepData } from "@/features/marketing/components/workflow-section/workflow-data";
import { WorkflowStep } from "@/features/marketing/components/workflow-section/workflow-list/workflow-step";

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -18 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function WorkflowList({
  steps,
  activeStep,
  onSelect,
  onStepKeyDown,
  animate = true,
}: {
  steps: WorkflowStepData[];
  activeStep: number;
  onSelect: (index: number) => void;
  onStepKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => void;
  animate?: boolean;
}) {
  return (
    <motion.div
      role="tablist"
      aria-orientation="vertical"
      aria-label="Esteo workflow"
      variants={animate ? listVariants : undefined}
      initial={animate ? "hidden" : false}
      animate={animate ? "show" : false}
      className="flex flex-col gap-3"
    >
      {steps.map((step, index) => (
        <motion.div key={step.id} variants={animate ? itemVariants : undefined}>
          <WorkflowStep
            step={step}
            index={index}
            isActive={activeStep === index}
            onSelect={() => onSelect(index)}
            onKeyDown={(event) => onStepKeyDown(event, index)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
