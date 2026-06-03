"use client";



import { useState, useTransition } from "react";

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

import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";

import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";

import type { Locale } from "@/lib/locale";



interface EstimateAiPanelProps {

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

  className?: string;

}



interface Message {

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

  className,

}: EstimateAiPanelProps) {

  const t = useTranslations("estimates");

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [pendingPatch, setPendingPatch] = useState<EstimateAgentPatch | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const [isUndoing, startUndoTransition] = useTransition();



  const handleSend = () => {

    if (!input.trim() || isPending) return;



    const userMessage = input.trim();

    setInput("");

    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);



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



      setPendingPatch(result.data);

      setMessages((prev) => [

        ...prev,

        {

          role: "assistant",

          content: result.data.reasoning ?? t("ai.proposedReasoning"),

        },

      ]);

    });

  };



  const handleApprove = () => {

    if (!pendingPatch) return;

    setError(null);



    startTransition(async () => {

      const result = await approveEditAction({

        versionId,

        workspaceId,

        workspaceSlug,

        estimateId,

        patch: pendingPatch,

        locale,

      });



      if (!result.success) {

        setError(result.error);

        return;

      }



      setPendingPatch(null);

      onApproved(result.data);

    });

  };



  const handleReject = () => {

    setPendingPatch(null);

  };



  const handleUndo = () => {

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

    <aside className={className}>

      <div className="flex items-center justify-between mb-3">

        <div className="flex items-center gap-2">

          <Bot className="size-4 text-primary" />

          <span className="text-sm font-medium">{t("editor.aiAssistant")}</span>

        </div>

        {maxCalls !== null && maxCalls !== undefined && (

          <span className="text-xs text-muted-foreground">

            {t("ai.callsLeft", {

              remaining: remainingCalls ?? "?",

              max: maxCalls,

            })}

          </span>

        )}

      </div>



      <div className="flex flex-col gap-2 mb-3 min-h-[100px] max-h-[300px] overflow-y-auto">

        {messages.length === 0 && (

          <p className="text-xs text-muted-foreground">{t("ai.emptyHint")}</p>

        )}

        {messages.map((msg, i) => (

          <div

            key={i}

            className={

              msg.role === "user"

                ? "self-end rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground max-w-[85%]"

                : "self-start rounded-lg bg-muted px-3 py-1.5 text-xs max-w-[85%]"

            }

          >

            {msg.content}

          </div>

        ))}

        {isPending && (

          <div className="self-start rounded-lg bg-muted px-3 py-1.5 text-xs flex items-center gap-2">

            <Loader2 className="size-3 animate-spin" />

            {t("ai.thinking")}

          </div>

        )}

      </div>



      {pendingPatch && (

        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">

          <p className="text-xs font-medium mb-2">{t("ai.proposed")}</p>

          <div className="flex gap-2">

            <Button size="sm" className="gap-1.5 flex-1" onClick={handleApprove} disabled={isPending}>

              <Check className="size-3" />

              {t("ai.approve")}

            </Button>

            <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={handleReject}>

              <X className="size-3" />

              {t("ai.reject")}

            </Button>

          </div>

        </div>

      )}



      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}



      <div className="flex gap-2">

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

          disabled={isPending || isAtLimit}

          rows={2}

          className="flex-1 min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

        />

        <Button

          size="icon-sm"

          onClick={handleSend}

          disabled={!input.trim() || isPending || isAtLimit}

          className="self-end"

          aria-label={t("ai.send")}

        >

          <Send className="size-3" />

        </Button>

      </div>



      <div className="mt-2 flex items-center justify-between">

        {isAtLimit && (

          <p className="text-xs text-muted-foreground">{t("ai.limitReached")}</p>

        )}

        <TooltipProvider>

          <Tooltip>

            <TooltipTrigger asChild>

              <Button

                variant="ghost"

                size="sm"

                className="gap-1.5 text-xs ml-auto"

                onClick={handleUndo}

                disabled={isUndoing || maxUndoSteps === 0}

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

