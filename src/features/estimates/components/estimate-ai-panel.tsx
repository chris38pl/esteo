"use client";



import { useEffect, useRef, useState, useTransition } from "react";

import { Bot, Check, Loader2, RotateCcw, Send, X } from "lucide-react";

import { useTranslations } from "next-intl";



import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {

  Tooltip,

  TooltipContent,

  TooltipProvider,

  TooltipTrigger,

} from "@/components/ui/tooltip";

import {

  approveEditAction,

  proposeEditAction,

  undoChangeAction,

} from "@/features/estimates/server/actions";

import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import type { AiMessageClient } from "@/features/estimates/lib/serialize-ai-messages";

import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";



export interface EstimateAiPanelProps {

  versionId: string;

  workspaceId: string;

  workspaceSlug: string;

  estimateId: string;

  locale: Locale;

  remainingCalls?: number | null;

  maxCalls?: number | null;

  maxUndoSteps?: number;

  onApproved: (result: {

    updatedAt: string;

    versionTree: VersionTreeClient | null;

  }) => void;

  initialMessages?: AiMessageClient[];

  initialPendingEdit?: ProposeEditResult | null;

  className?: string;

  onClose?: () => void;

  readOnly?: boolean;

}



interface Message {

  id?: string;

  role: "user" | "assistant";

  content: string;

}



export function EstimateAiPanel({

  versionId,

  workspaceId,

  workspaceSlug,

  estimateId,

  locale,

  remainingCalls,

  maxCalls,

  maxUndoSteps = 1,

  onApproved,

  initialMessages = [],

  initialPendingEdit = null,

  className,

  onClose,

  readOnly = false,

}: EstimateAiPanelProps) {

  const t = useTranslations("estimates");

  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    })),
  );

  const [input, setInput] = useState("");

  const [pendingEdit, setPendingEdit] = useState<ProposeEditResult | null>(
    initialPendingEdit,
  );

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const [isUndoing, startUndoTransition] = useTransition();

  const scrollBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendingEdit) return;
    const scrollBody = scrollBodyRef.current;
    if (!scrollBody) return;
    scrollBody.scrollTop = scrollBody.scrollHeight;
  }, [pendingEdit]);

  const handleSend = () => {

    if (readOnly || !input.trim() || isPending) return;



    const userMessage = input.trim();

    setInput("");

    setError(null);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);



    startTransition(async () => {

      const result = await proposeEditAction({

        versionId,

        workspaceId,

        workspaceSlug,

        estimateId,

        message: userMessage,

        locale,

      });



      if (!result.success) {

        setError(result.error);

        return;

      }



      const assistantContent =
        result.data.patch.reasoning ?? t("ai.proposedReasoning");

      setPendingEdit(result.data);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
        },
      ]);

    });

  };



  const handleApprove = () => {

    if (readOnly || !pendingEdit) return;

    setError(null);



    startTransition(async () => {

      const result = await approveEditAction({

        versionId,

        workspaceId,

        workspaceSlug,

        estimateId,

        patch: pendingEdit.patch,

        locale,

      });



      if (!result.success) {

        setError(result.error);

        return;

      }



      setPendingEdit(null);

      onApproved(result.data);

    });

  };



  const handleReject = () => {

    setPendingEdit(null);

  };



  const handleUndo = () => {

    if (readOnly) return;

    setError(null);

    startUndoTransition(async () => {

      const result = await undoChangeAction({

        versionId,

        workspaceId,

        workspaceSlug,

        estimateId,

        locale,

      });

      if (!result.success) {

        setError(result.error);

        return;

      }

      onApproved(result.data);

    });

  };



  const isAtLimit = maxCalls !== null && maxCalls !== undefined && remainingCalls === 0;



  return (

    <aside
      className={cn(
        "estimate-ai-panel rounded-2xl border bg-card/95 p-4 shadow-sm",
        className,
      )}
    >

      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="size-4" />
          </span>

          <div>
            <p className="text-sm font-semibold">{t("editor.aiAssistant")}</p>
            <p className="text-xs text-muted-foreground">{t("ai.panelHint")}</p>
          </div>

        </div>

        <div className="flex shrink-0 items-center gap-1">
          {maxCalls !== null && maxCalls !== undefined ? (
            <span className="text-xs text-muted-foreground">
              {t("ai.callsLeft", {
                remaining: remainingCalls ?? "?",
                max: maxCalls,
              })}
            </span>
          ) : null}
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={onClose}
              aria-label={t("editor.closeAi")}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

      </div>



      <div ref={scrollBodyRef} className="estimate-ai-scroll-body mb-3 flex flex-col gap-3">
        <div className="estimate-ai-messages flex flex-col gap-2 rounded-xl border bg-muted/20 p-3">
          {messages.length === 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">{t("ai.emptyHint")}</p>
          )}

          {messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={
                msg.role === "user"
                  ? "self-end max-w-[85%] break-words rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground shadow-sm"
                  : "self-start max-w-[85%] break-words rounded-xl bg-background px-3 py-2 text-xs shadow-sm"
              }
            >
              {msg.content}
            </div>
          ))}

          {isPending && (
            <div className="flex items-center gap-2 self-start rounded-xl bg-background px-3 py-2 text-xs shadow-sm">
              <Loader2 className="size-3 animate-spin" />
              {t("ai.thinking")}
            </div>
          )}
        </div>

        {pendingEdit && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
            <p className="mb-2 text-xs font-semibold">{t("ai.proposed")}</p>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                {t("ai.impactBefore", {
                  gross: pendingEdit.simulatedImpact.before.gross.toLocaleString(locale),
                })}
              </p>
              <p>
                {t("ai.impactAfter", {
                  gross: pendingEdit.simulatedImpact.after.gross.toLocaleString(locale),
                })}
              </p>
              <p>
                {t("ai.impactDiff", {
                  diff: pendingEdit.simulatedImpact.difference.gross.toLocaleString(locale, {
                    signDisplay: "exceptZero",
                  }),
                })}
              </p>
              {pendingEdit.guidance.financialTarget && (
                <p>
                  {t("ai.targetProgress", {
                    target: pendingEdit.guidance.financialTarget.targetValue.toLocaleString(
                      locale,
                    ),
                    after: pendingEdit.simulatedImpact.after.gross.toLocaleString(locale),
                  })}
                </p>
              )}
            </div>

            {pendingEdit.warnings.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-xs text-amber-800 dark:text-amber-200">
                {pendingEdit.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {pendingEdit && (
        <div className="estimate-ai-proposal-actions mb-3 flex shrink-0 gap-2">
          <Button
            size="sm"
            className="h-9 flex-1 gap-1.5 rounded-lg"
            onClick={handleApprove}
            disabled={readOnly || isPending}
          >
            <Check className="size-3" />
            {t("ai.approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 flex-1 gap-1.5 rounded-lg"
            onClick={handleReject}
          >
            <X className="size-3" />
            {t("ai.reject")}
          </Button>
        </div>
      )}



      {error && <p className="mb-2 shrink-0 text-xs text-destructive">{error}</p>}



      <div className="flex shrink-0 gap-2">

        <textarea

          value={input}

          onChange={(e) => setInput(e.target.value)}

          onKeyDown={(e) => {

            if (e.key === "Enter" && !e.shiftKey) {

              e.preventDefault();

              handleSend();

            }

          }}

          placeholder={t("ai.placeholder")}

          disabled={readOnly || isPending || isAtLimit}

          rows={2}

          className="min-w-0 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

        />

        <Button

          size="icon-sm"

          onClick={handleSend}

          disabled={readOnly || !input.trim() || isPending || isAtLimit}

          className="self-end rounded-lg"

          aria-label={t("ai.send")}

        >

          <Send className="size-3" />

        </Button>

      </div>



      <div className="mt-2 flex shrink-0 items-center justify-between">

        {isAtLimit && (

          <p className="text-xs text-muted-foreground">{t("ai.limitReached")}</p>

        )}

        <TooltipProvider>

          <Tooltip>

            <TooltipTrigger asChild>

              <Button

                variant="ghost"

                size="sm"

                className="ml-auto gap-1.5 rounded-lg text-xs"

                onClick={handleUndo}

                disabled={readOnly || isUndoing || maxUndoSteps === 0}

              >

                <RotateCcw className="size-3" />

                {t("ai.undo")}

                {maxUndoSteps === 1 && (

                  <Badge variant="outline" className="text-xs">

                    {t("ai.upgradeForMore")}

                  </Badge>

                )}

              </Button>

            </TooltipTrigger>

            <TooltipContent>

              {maxUndoSteps === 1

                ? t("ai.undoTooltipFree")

                : t("ai.undoTooltipPaid", { steps: maxUndoSteps })}

            </TooltipContent>

          </Tooltip>

        </TooltipProvider>

      </div>

    </aside>

  );

}

