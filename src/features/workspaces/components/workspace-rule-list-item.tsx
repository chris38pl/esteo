"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function WorkspaceRuleListItem({
  index,
  content,
  metaLabel,
  active,
  isSystem,
  isPending,
  onActiveChange,
  onEdit,
  onDelete,
}: {
  index: number;
  content: string;
  metaLabel: string;
  active: boolean;
  isSystem?: boolean;
  isPending?: boolean;
  onActiveChange: (active: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("workspaces.settings.rules");

  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border border-border/50 bg-card px-4 py-4 shadow-xs",
        isSystem && "opacity-80",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums",
          isSystem
            ? "border-muted-foreground/30 text-muted-foreground"
            : "border-violet-500/50 text-violet-600 dark:border-primary/50 dark:text-primary",
        )}
        aria-hidden
      >
        {index}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p
          className={cn(
            "text-sm leading-relaxed",
            isSystem ? "text-muted-foreground" : "text-foreground/90",
          )}
        >
          {content}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">{metaLabel}</p>
          {isSystem ? (
            <Badge
              variant="secondary"
              className="rounded-md bg-muted/80 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t("systemBadge")}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-1 pt-0.5">
        {!isSystem && onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-muted-foreground hover:text-foreground"
            disabled={isPending}
            onClick={onEdit}
            aria-label={t("edit")}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {!isSystem && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={onDelete}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
        <Switch
          checked={active}
          disabled={isPending}
          onCheckedChange={onActiveChange}
          aria-label={t("activeLabel")}
          className="data-[state=checked]:bg-violet-600 dark:data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  );
}
