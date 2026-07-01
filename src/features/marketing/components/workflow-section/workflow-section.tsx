"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingSection } from "@/features/marketing/components/section";
import { InteractiveDemo } from "@/features/marketing/components/workflow-section/interactive-demo/interactive-demo";
import { useWorkflowDemo } from "@/features/marketing/components/workflow-section/interactive-demo/use-workflow-demo";
import { useWorkflowSectionActivation } from "@/features/marketing/components/workflow-section/interactive-demo/use-workflow-section-activation";
import { getWorkflowContent } from "@/features/marketing/components/workflow-section/workflow-data";
import { WorkflowList } from "@/features/marketing/components/workflow-section/workflow-list/workflow-list";
import { WorkflowStep } from "@/features/marketing/components/workflow-section/workflow-list/workflow-step";
import type { Locale } from "@/lib/locale";

const ease = [0.22, 1, 0.36, 1] as const;

export function WorkflowSectionContent({ locale }: { locale: Locale }) {
  const content = getWorkflowContent(locale);
  const reducedMotion = useReducedMotion();
  const headingRef = useRef<HTMLDivElement>(null);
  const workflowDemoRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10% 0px" });
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(false);
  const { activeStep, demoSessionKey, resetToFirstStep, selectStep, selectNext, selectPrevious } =
    useWorkflowDemo(reducedMotion, isAutoplayEnabled);

  const handleWorkflowActivate = useCallback(() => {
    resetToFirstStep();
  }, [resetToFirstStep]);

  useWorkflowSectionActivation({
    targetRef: workflowDemoRef,
    onActivate: handleWorkflowActivate,
    onAutoplayEnabledChange: setIsAutoplayEnabled,
  });

  const handleStepKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        selectNext();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectPrevious();
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        selectStep(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        selectStep(content.steps.length - 1);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectStep(index);
      }
    },
    [content.steps.length, selectNext, selectPrevious, selectStep],
  );

  return (
    <MarketingSection
      id="workflow"
      className="dark relative isolate overflow-x-clip overflow-y-visible border-t border-border/40 bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[min(100vw,48rem)] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-3xl dark:bg-blue-400/[0.08]"
      />

      <MarketingContainer size="wide">
        <div ref={headingRef} className="mx-auto max-w-3xl text-center">
          <h2 className="text-[38px] font-semibold leading-[1.1] tracking-[-0.03em]">
            <span className="block text-foreground">{content.title}</span>
            <span className="block text-primary">{content.titleLine2}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:mt-6 sm:text-[0.9375rem] sm:leading-7">
            {content.description}
          </p>
        </div>

        <div ref={workflowDemoRef} className="mt-12 sm:mt-14 lg:mt-16">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch lg:gap-10 xl:gap-12">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, x: -28 }}
              animate={headingInView ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.65, ease }}
              className="min-h-0"
            >
              <WorkflowList
                steps={content.steps}
                activeStep={activeStep}
                onSelect={selectStep}
                onStepKeyDown={handleStepKeyDown}
                animate={headingInView && !reducedMotion}
              />
            </motion.div>

            <motion.div
              role="tabpanel"
              id={`workflow-panel-${activeStep}`}
              aria-labelledby={`workflow-step-${activeStep}`}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={headingInView ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.65, delay: 0.08, ease }}
              className="h-full min-h-0"
            >
              <InteractiveDemo
                activeStep={activeStep}
                sessionKey={demoSessionKey}
                locale={locale}
                label={content.demoLabel}
                reducedMotion={reducedMotion}
              />
            </motion.div>
          </div>

          <div className="space-y-3 lg:hidden" role="tablist" aria-label="Esteo workflow">
            {content.steps.map((step, index) => {
              const isActive = activeStep === index;

              return (
                <div key={step.id} className="space-y-3">
                  <WorkflowStep
                    step={step}
                    index={index}
                    isActive={isActive}
                    mobile
                    onSelect={() => selectStep(index)}
                    onKeyDown={(event) => handleStepKeyDown(event, index)}
                  />

                  {isActive ? (
                    <motion.div
                      role="tabpanel"
                      id={`workflow-panel-${index}`}
                      aria-labelledby={`workflow-step-${index}`}
                      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="min-h-[20rem]"
                    >
                      <InteractiveDemo
                        activeStep={activeStep}
                        sessionKey={demoSessionKey}
                        locale={locale}
                        label={content.demoLabel}
                        reducedMotion={reducedMotion}
                      />
                    </motion.div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
