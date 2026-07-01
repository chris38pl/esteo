"use client";

import { useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, CheckCheck, Send, Sparkles, X } from "lucide-react";

import type { HeroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";
import { HERO_PHONE_PHASE } from "@/features/marketing/components/hero/hero-phone-demo-data";
import { TypingMessage } from "@/features/marketing/components/hero/typing-message";

function AssistantAvatar() {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ai text-ai-foreground">
      <Bot className="size-3" />
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 py-0.5">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1 rounded-full bg-slate-400"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -1, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: index * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

export function HeroPhoneAssistantModal({
  open,
  phase,
  assistant,
}: {
  open: boolean;
  phase: number;
  assistant: HeroAnimationContent["assistant"];
}) {
  const reducedMotion = useReducedMotion();
  const messagesRef = useRef<HTMLDivElement>(null);

  const showUser = phase >= HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING;
  const showThinking = phase === HERO_PHONE_PHASE.ASSISTANT_THINKING;
  const showAi = phase >= HERO_PHONE_PHASE.ASSISTANT_AI_TYPING;
  const aiTypingActive = phase === HERO_PHONE_PHASE.ASSISTANT_AI_TYPING;
  const headerStatus = showThinking || aiTypingActive ? assistant.thinking : assistant.status;

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container || !open) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [open, phase, showUser, showThinking, showAi]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="hero-assistant-modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22 }}
            className="absolute inset-0 z-[80] bg-black/45"
            aria-hidden
          />
          <motion.div
            key="hero-assistant-modal-panel"
            initial={{ y: reducedMotion ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: reducedMotion ? 0 : "100%" }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.38, ease: [0.32, 0.72, 0, 1] }
            }
            className="hero-phone-assistant-modal absolute inset-x-0 bottom-0 z-[90] flex max-h-[74%] min-h-[58%] flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#07101f]/98 shadow-[0_-16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="flex justify-center pt-2">
              <span className="h-1 w-8 rounded-full bg-white/20" aria-hidden />
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 pb-2.5 pt-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ai text-ai-foreground">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white">{assistant.title}</p>
                  <p className="truncate text-[10px] text-slate-400">{headerStatus}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg text-slate-400"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div
              ref={messagesRef}
              className="hero-assistant-messages-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3"
            >
              <AnimatePresence initial={false}>
                {showUser ? (
                  <motion.div
                    key="user"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-2.5 py-2 text-[10px] leading-5 text-primary-foreground shadow-[0_8px_24px_rgba(37,99,235,0.28)]">
                      <p>{assistant.user}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-blue-100/80">
                        <span>{assistant.timestamp}</span>
                        <CheckCheck className="size-2.5" />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {showThinking ? (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-end gap-2"
                  >
                    <AssistantAvatar />
                    <div className="rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-2.5 py-2 text-[10px] leading-5 text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{assistant.thinking}</span>
                        <ThinkingDots />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {showAi ? (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2"
                  >
                    <AssistantAvatar />
                    <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-2.5 py-2 text-[10px] leading-5 text-slate-100">
                      {aiTypingActive ? (
                        <TypingMessage text={assistant.ai} active={aiTypingActive} />
                      ) : (
                        <p>{assistant.ai}</p>
                      )}
                      {!aiTypingActive ? (
                        <p className="mt-1 text-right text-[9px] text-slate-500">{assistant.timestamp}</p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/8 px-3 py-2.5">
              <div className="flex items-end gap-1.5">
                <div className="min-h-8 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] leading-5 text-slate-500">
                  {assistant.inputPlaceholder}
                </div>
                <button
                  type="button"
                  aria-label="Send"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
