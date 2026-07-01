"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCheck, Send, Sparkles, X } from "lucide-react";

import type { HeroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";
import { HERO_PHONE_PHASE } from "@/features/marketing/components/hero/hero-phone-demo-data";
import { TypingMessage } from "@/features/marketing/components/hero/typing-message";
import { cn } from "@/lib/utils";

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

export function FloatingAssistant({
  phase,
  assistant,
  placement = "desktop",
}: {
  phase: number;
  assistant: HeroAnimationContent["assistant"];
  placement?: "desktop" | "mobile";
}) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const [inputDraft, setInputDraft] = useState("");

  const isInputTyping = phase === HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING;
  const isSendClick = phase === HERO_PHONE_PHASE.ASSISTANT_SEND_CLICK;
  const showUser = phase >= HERO_PHONE_PHASE.ASSISTANT_USER_SENT;
  const showThinking = phase === HERO_PHONE_PHASE.ASSISTANT_THINKING;
  const showAi = phase >= HERO_PHONE_PHASE.ASSISTANT_AI_TYPING;
  const aiTypingActive = phase === HERO_PHONE_PHASE.ASSISTANT_AI_TYPING;
  const showInputDraft = phase >= HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING && phase < HERO_PHONE_PHASE.ASSISTANT_USER_SENT;
  const headerStatus =
    showThinking
      ? assistant.thinking
      : aiTypingActive
        ? assistant.thinking
        : assistant.status;

  useEffect(() => {
    if (phase < HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING) {
      setInputDraft("");
      return;
    }

    if (phase > HERO_PHONE_PHASE.ASSISTANT_SEND_CLICK) {
      setInputDraft("");
      return;
    }

    if (phase === HERO_PHONE_PHASE.ASSISTANT_SEND_CLICK) {
      setInputDraft(assistant.user);
      return;
    }

    let index = 0;
    setInputDraft("");

    const interval = window.setInterval(() => {
      index += 1;
      setInputDraft(assistant.user.slice(0, index));

      if (index >= assistant.user.length) {
        window.clearInterval(interval);
      }
    }, 34);

    return () => window.clearInterval(interval);
  }, [phase, assistant.user]);

  useLayoutEffect(() => {
    const container = messagesRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [phase, showUser, showThinking, showAi, assistant.welcome]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "z-40 flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07101f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl",
        placement === "desktop"
          ? "absolute left-[calc(100%-4rem)] top-[calc(5.25rem+30px)] h-[20rem] w-[16.5rem] lg:left-[calc(100%-3.5rem)] lg:top-[calc(6.5rem+30px)] xl:left-[calc(100%-3rem)] xl:top-[calc(7.25rem+30px)]"
          : "relative mx-auto mb-7 h-[19rem] max-w-[19rem]",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ai text-ai-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{assistant.title}</p>
            <p className="truncate text-[10px] text-slate-400">{headerStatus}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="flex size-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div
        ref={messagesRef}
        className="hero-assistant-messages-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3"
      >
        <div className="flex items-end gap-2">
          <AssistantAvatar />
          <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.04] px-2.5 py-2 text-[10px] leading-5 text-slate-100">
            <p>{assistant.welcome}</p>
            <p className="mt-1 text-right text-[9px] text-slate-500">{assistant.timestamp}</p>
          </div>
        </div>

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
          <div
            className={cn(
              "min-h-8 min-w-0 flex-1 rounded-2xl border px-3 py-1.5 text-[10px] leading-5",
              showInputDraft
                ? "border-white/15 bg-white/[0.05] text-slate-100"
                : "border-white/10 bg-white/[0.03] text-slate-500",
            )}
          >
            {showInputDraft ? (
              <span className="block min-h-5">
                {inputDraft}
                {isInputTyping ? (
                  <motion.span
                    aria-hidden
                    className="ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-primary/80"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                ) : null}
              </span>
            ) : (
              assistant.inputPlaceholder
            )}
          </div>
          <motion.button
            type="button"
            aria-label="Send"
            animate={
              isSendClick
                ? { scale: [1, 0.88, 1], boxShadow: ["0 8px 20px rgba(37,99,235,0.35)", "0 4px 12px rgba(37,99,235,0.5)", "0 8px 20px rgba(37,99,235,0.35)"] }
                : { scale: 1 }
            }
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
          >
            <Send className="size-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
