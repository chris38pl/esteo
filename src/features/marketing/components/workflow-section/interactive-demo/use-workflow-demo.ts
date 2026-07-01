"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  WORKFLOW_STEP_COUNT,
  getWorkflowStepDuration,
} from "@/features/marketing/components/workflow-section/workflow-data";

export function useWorkflowDemo(reducedMotion: boolean | null, autoplayEnabled = true) {
  const [activeStep, setActiveStep] = useState(0);
  const [demoSessionKey, setDemoSessionKey] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleAutoplay = useCallback(
    (stepIndex: number) => {
      clearTimer();
      if (reducedMotion || !autoplayEnabled) {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        setActiveStep((current) => (current + 1) % WORKFLOW_STEP_COUNT);
      }, getWorkflowStepDuration(stepIndex));
    },
    [autoplayEnabled, clearTimer, reducedMotion],
  );

  useEffect(() => {
    scheduleAutoplay(activeStep);
    return clearTimer;
  }, [activeStep, scheduleAutoplay, clearTimer]);

  const resetToFirstStep = useCallback(() => {
    setActiveStep(0);
    setDemoSessionKey((current) => current + 1);
  }, []);

  const selectStep = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, WORKFLOW_STEP_COUNT - 1));
    setActiveStep(clamped);
  }, []);

  const selectNext = useCallback(() => {
    setActiveStep((current) => (current + 1) % WORKFLOW_STEP_COUNT);
  }, []);

  const selectPrevious = useCallback(() => {
    setActiveStep((current) => (current - 1 + WORKFLOW_STEP_COUNT) % WORKFLOW_STEP_COUNT);
  }, []);

  return {
    activeStep,
    demoSessionKey,
    resetToFirstStep,
    selectStep,
    selectNext,
    selectPrevious,
  };
}
