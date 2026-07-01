"use client";

import { ChevronDown, Cloud, Download, Forward, Mail, Menu, Pencil, Reply } from "lucide-react";
import { motion } from "framer-motion";

import type { WorkflowDemoCopy } from "@/features/marketing/components/workflow-section/workflow-data";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const outlook = {
  shell: "#0b1120",
  panel: "#111827",
  panelRaised: "#1a2332",
  border: "rgba(148,163,184,0.14)",
  blue: "#0078d4",
  text: "#f1f5f9",
  muted: "#94a3b8",
  dim: "#64748b",
  selected: "rgba(0,120,212,0.14)",
} as const;

function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full bg-[#0078d4] text-[9px] font-semibold text-white sm:size-7 sm:text-[10px]",
        className,
      )}
    >
      {initials}
    </span>
  );
}

function OutlookSidebar({ copy }: { copy: WorkflowDemoCopy["delivery"] }) {
  const folders = [
    copy.inboxLabel,
    copy.sentFolder,
    copy.draftsFolder,
    copy.deletedFolder,
    copy.spamFolder,
  ];

  return (
    <aside
      className="hidden min-h-0 w-[7.75rem] shrink-0 flex-col border-r sm:flex lg:w-[8.5rem]"
      style={{ borderColor: outlook.border, backgroundColor: outlook.panel }}
    >
      <div className="flex items-center gap-0.5 p-1 lg:gap-1 lg:p-1.5">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="grid size-5 shrink-0 place-items-center rounded-sm text-white/85 lg:size-6"
        >
          <Menu className="size-3 lg:size-3.5" strokeWidth={2.25} />
        </button>

        <div
          className="flex min-w-0 flex-1 items-center gap-1 rounded-sm px-1 py-1 text-white lg:gap-1.5 lg:px-1.5 lg:py-1.5"
          style={{ backgroundColor: outlook.blue }}
        >
          <span className="grid size-3 shrink-0 place-items-center rounded-[3px] bg-white/18 lg:size-3.5">
            <Pencil className="size-2 lg:size-2.5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="truncate text-[6px] font-semibold leading-tight lg:text-[7px]">
            {copy.newMessage}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-1 pb-2 lg:px-1.5">
        <p
          className="px-1 py-1 text-[7px] font-semibold uppercase tracking-wide lg:text-[8px]"
          style={{ color: outlook.dim }}
        >
          {copy.favoritesLabel}
        </p>
        {folders.map((folder, index) => {
          const isInbox = index === 0;

          return (
            <div
              key={folder}
              className={cn(
                "flex items-center justify-between gap-1 rounded-md px-1.5 py-1 text-[7px] lg:px-2 lg:py-1.5 lg:text-[8px]",
                isInbox && "font-semibold",
              )}
              style={{
                color: isInbox ? outlook.blue : outlook.muted,
                backgroundColor: isInbox ? outlook.selected : "transparent",
              }}
            >
              <span className="truncate">{folder}</span>
              {isInbox ? (
                <span
                  className="shrink-0 rounded-full px-1 text-[6px] font-semibold lg:text-[7px]"
                  style={{ backgroundColor: outlook.blue, color: "#fff" }}
                >
                  1
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function InboxMessageRow({
  copy,
  selected,
  reducedMotion,
}: {
  copy: WorkflowDemoCopy["delivery"];
  selected: boolean;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className={cn(
        "relative rounded-md border px-1.5 py-1.5 lg:px-2 lg:py-2",
        selected ? "border-[#0078d4]/40" : "border-transparent",
      )}
      style={{ backgroundColor: selected ? outlook.selected : "transparent" }}
    >
      {selected ? (
        <span
          className="absolute bottom-1 left-0 top-1 w-0.5 rounded-full"
          style={{ backgroundColor: outlook.blue }}
          aria-hidden
        />
      ) : null}

      <div className="flex items-start gap-1.5 pl-1 lg:gap-2">
        <Avatar initials="ED" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[8px] font-semibold lg:text-[9px]">{copy.emailFrom}</span>
            <span className="shrink-0 text-[7px] lg:text-[8px]" style={{ color: outlook.dim }}>
              {copy.emailTimeShort}
            </span>
          </div>
          <p
            className="mt-0.5 truncate text-[8px] font-medium lg:text-[9px]"
            style={{ color: selected ? outlook.blue : outlook.text }}
          >
            {copy.emailSubject}
          </p>
          <p
            className="mt-0.5 line-clamp-2 text-[7px] leading-snug lg:text-[8px]"
            style={{ color: outlook.dim }}
          >
            {copy.emailPreview}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function EmailReadingPane({
  copy,
  highlightAttachment,
  reducedMotion,
  animateEntrance,
  compact,
}: {
  copy: WorkflowDemoCopy["delivery"];
  highlightAttachment: boolean;
  reducedMotion: boolean | null;
  animateEntrance: boolean;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={animateEntrance && !reducedMotion ? { opacity: 0, x: 12 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, ease }}
      className="flex h-full min-h-0 flex-col overflow-y-auto"
    >
      <div
        className={cn(
          "hidden shrink-0 items-center gap-2 border-b px-2.5 py-1.5 text-[7px] lg:flex lg:px-3 lg:text-[8px]",
        )}
        style={{ borderColor: outlook.border, color: outlook.muted }}
      >
        <span className="inline-flex items-center gap-1">
          <Reply className="size-2.5" aria-hidden />
          {copy.reply}
        </span>
        <span className="inline-flex items-center gap-1">
          <Forward className="size-2.5" aria-hidden />
          {copy.forward}
        </span>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col", compact ? "p-3" : "p-2.5 lg:p-3")}>
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "font-semibold leading-snug",
              compact ? "text-sm" : "text-[10px] lg:text-xs",
            )}
          >
            {copy.emailSubject}
          </h4>
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <Reply className="size-3.5" style={{ color: outlook.muted }} aria-hidden />
            <Forward className="size-3.5" style={{ color: outlook.muted }} aria-hidden />
          </div>
        </div>

        <div
          className="mt-2 flex items-start gap-2 border-b pb-2 lg:mt-2.5 lg:pb-2.5"
          style={{ borderColor: outlook.border }}
        >
          <Avatar initials="ED" className="size-7 text-[10px] lg:size-8 lg:text-[11px]" />
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", compact ? "text-[11px]" : "text-[9px] lg:text-[10px]")}>
              {copy.emailFrom}
            </p>
            <p
              className={cn(compact ? "text-[10px]" : "text-[8px] lg:text-[9px]")}
              style={{ color: outlook.dim }}
            >
              {copy.sentLabel} {copy.emailRecipient}
            </p>
          </div>
          <span
            className={cn("shrink-0", compact ? "text-[10px]" : "text-[8px] lg:text-[9px]")}
            style={{ color: outlook.dim }}
          >
            {copy.emailSent}
          </span>
        </div>

        <div
          className={cn(
            "mt-2.5 space-y-2 leading-5 lg:mt-3",
            compact ? "text-[11px]" : "text-[8px] lg:text-[9px]",
          )}
          style={{ color: "#cbd5e1" }}
        >
          <p>{copy.emailBodyGreeting}</p>
          <p>{copy.emailBodyMain}</p>
          <p>{copy.emailBodyFollowUp}</p>
          <p>{copy.emailSignOff}</p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="size-6 rounded-md lg:size-7" draggable={false} />
          <div className="min-w-0">
            <p className={cn("font-bold lowercase tracking-tight", compact ? "text-[11px]" : "text-[9px] lg:text-[10px]")}>
              esteo
            </p>
            <p className={cn(compact ? "text-[10px]" : "text-[7px] lg:text-[8px]")} style={{ color: outlook.dim }}>
              {copy.emailFrom}
            </p>
            <p className={cn(compact ? "text-[10px]" : "text-[7px] lg:text-[8px]")} style={{ color: outlook.blue }}>
              {copy.websiteUrl}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          tabIndex={-1}
          aria-hidden
          initial={false}
          animate={
            highlightAttachment && !reducedMotion
              ? {
                  scale: [1, 1.015, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(0,120,212,0)",
                    "0 0 0 3px rgba(0,120,212,0.22)",
                    "0 0 0 0 rgba(0,120,212,0)",
                  ],
                }
              : { scale: 1 }
          }
          transition={{
            duration: 1.1,
            repeat: highlightAttachment && !reducedMotion ? Infinity : 0,
          }}
          className={cn(
            "mt-3 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors lg:gap-2.5 lg:px-2.5 lg:py-2",
            highlightAttachment ? "border-[#0078d4]/55" : "",
          )}
          style={{
            borderColor: highlightAttachment ? undefined : outlook.border,
            backgroundColor: outlook.panelRaised,
          }}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded bg-red-600/90 text-[8px] font-bold text-white lg:size-8 lg:text-[9px]">
            PDF
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate font-medium", compact ? "text-[11px]" : "text-[8px] lg:text-[9px]")}>
              {copy.attachmentName}
            </span>
            <span className={cn(compact ? "text-[10px]" : "text-[7px] lg:text-[8px]")} style={{ color: outlook.dim }}>
              PDF · 248 KB
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1" style={{ color: outlook.muted }}>
            <Download className="size-3 lg:size-3.5" aria-hidden />
            <Cloud className="size-3 lg:size-3.5" aria-hidden />
            <ChevronDown className="size-3 lg:size-3.5" aria-hidden />
          </div>
        </motion.button>

        {highlightAttachment ? (
          <p
            className={cn("mt-1.5 text-center font-medium", compact ? "text-[10px]" : "text-[7px] lg:text-[8px]")}
            style={{ color: outlook.blue }}
          >
            {copy.openAttachment}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3 lg:gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1",
              compact ? "text-[10px]" : "text-[7px] lg:text-[8px]",
            )}
            style={{ borderColor: outlook.border, color: outlook.muted }}
          >
            <Reply className="size-2.5" aria-hidden />
            {copy.reply}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1",
              compact ? "text-[10px]" : "text-[7px] lg:text-[8px]",
            )}
            style={{ borderColor: outlook.border, color: outlook.muted }}
          >
            <Forward className="size-2.5" aria-hidden />
            {copy.forward}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function EmailDeliveryMockup({
  copy,
  phase,
  reducedMotion,
}: {
  copy: WorkflowDemoCopy["delivery"];
  phase: number;
  reducedMotion: boolean | null;
}) {
  const showOpenEmail = phase >= 1;
  const highlightAttachment = phase >= 2;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="flex h-full min-h-[16rem] w-full flex-col overflow-hidden text-left sm:min-h-0"
      style={{
        backgroundColor: outlook.shell,
        color: outlook.text,
      }}
    >
      <div className="flex min-h-[14rem] flex-1 flex-col sm:min-h-0 sm:grid sm:grid-cols-[auto_minmax(0,0.88fr)_minmax(0,1.28fr)]">
        <OutlookSidebar copy={copy} />

        {/* Message list — desktop only, stays visible after open */}
        <section
          className="hidden min-h-0 min-w-0 flex-col border-r sm:flex"
          style={{ borderColor: outlook.border, backgroundColor: outlook.panel }}
        >
          <div
            className="flex shrink-0 items-center gap-2 border-b px-2 py-1.5 text-[8px] lg:px-2.5 lg:py-2 lg:text-[9px]"
            style={{ borderColor: outlook.border }}
          >
            <span className="font-semibold" style={{ color: outlook.blue }}>
              {copy.focusedTab}
            </span>
            <span style={{ color: outlook.dim }}>{copy.otherTab}</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-1 lg:p-1.5">
            <InboxMessageRow
              copy={copy}
              selected={showOpenEmail}
              reducedMotion={reducedMotion}
            />
          </div>
        </section>

        {/* Reading pane */}
        <section
          className="flex min-h-[14rem] min-w-0 flex-1 flex-col sm:min-h-0"
          style={{ backgroundColor: outlook.shell }}
        >
          {/* Mobile — mail od razu */}
          <div className="flex min-h-[14rem] flex-1 flex-col sm:hidden">
            <EmailReadingPane
              copy={copy}
              highlightAttachment={highlightAttachment}
              reducedMotion={reducedMotion}
              animateEntrance={false}
              compact
            />
          </div>

          {/* Desktop — najpierw pusty podgląd, potem otwarty mail */}
          <div
            className={cn(
              "hidden min-h-0 flex-1 flex-col",
              showOpenEmail ? "sm:flex" : "sm:hidden",
            )}
          >
            <EmailReadingPane
              copy={copy}
              highlightAttachment={highlightAttachment}
              reducedMotion={reducedMotion}
              animateEntrance={showOpenEmail}
            />
          </div>

          <div
            className={cn(
              "hidden min-h-0 flex-1 place-items-center p-4 text-center",
              !showOpenEmail && "sm:grid",
            )}
          >
            <div>
              <Mail className="mx-auto mb-2 size-5" style={{ color: outlook.dim }} aria-hidden />
              <p className="text-[9px]" style={{ color: outlook.dim }}>
                {copy.inboxLabel}
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
