"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Coins, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import { useMobileKeyboardViewportInset } from "@/features/estimates/hooks/use-mobile-keyboard-viewport-inset";
import {
  createMobileDismissGuardedOpenChange,
  getMobileSheetOutsideDismissHandlers,
  useIgnoreInitialOutsideDismiss,
} from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
import {
  PRICE_LIST_CURRENCY_LENGTH,
  PRICE_LIST_NAME_MAX_LENGTH,
} from "@/features/price-lists/lib/price-list-limits";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function PriceListMetadataDialog({
  open,
  onOpenChange,
  initialName,
  initialCurrency,
  readOnly,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialCurrency: string;
  readOnly: boolean;
  onSave: (payload: { name: string; currency: string }) => void | Promise<void>;
}) {
  const t = useTranslations("workspaces.configuration.priceLists.editor");
  const tToast = useTranslations("workspaces.configuration.priceLists.toast");
  const isMobile = useEstimateMobileLayout();
  const ignoreOutsideDismissRef = useIgnoreInitialOutsideDismiss(open && isMobile);
  const keyboardInset = useMobileKeyboardViewportInset(open && isMobile);
  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setCurrency(initialCurrency);
    }
  }, [initialCurrency, initialName, open]);

  const trimmedName = name.trim();
  const trimmedCurrency = currency.trim().toUpperCase();
  const canSave =
    !readOnly &&
    !pending &&
    trimmedName.length > 0 &&
    name.length <= PRICE_LIST_NAME_MAX_LENGTH &&
    trimmedCurrency.length === PRICE_LIST_CURRENCY_LENGTH;

  const handleOpenChange = createMobileDismissGuardedOpenChange(
    ignoreOutsideDismissRef,
    onOpenChange,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    setPending(true);
    try {
      await onSave({ name: trimmedName, currency: trimmedCurrency });
      appToast.success(tToast("metadataSaved"));
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <label htmlFor="price-list-metadata-name" className="text-sm font-medium">
          {t("metadataNameLabel")}
        </label>
        <div className="relative">
          <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="price-list-metadata-name"
            value={name}
            disabled={readOnly || pending}
            placeholder={t("namePlaceholder")}
            maxLength={PRICE_LIST_NAME_MAX_LENGTH}
            autoFocus={!isMobile}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-md pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="price-list-metadata-currency" className="text-sm font-medium">
          {t("metadataCurrencyLabel")}
        </label>
        <div className="relative">
          <Coins className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="price-list-metadata-currency"
            value={currency}
            disabled={readOnly || pending}
            placeholder={t("currencyPlaceholder")}
            maxLength={PRICE_LIST_CURRENCY_LENGTH}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            className="h-11 rounded-md pl-10 uppercase"
          />
        </div>
      </div>
    </>
  );

  const actionButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-md"
        disabled={pending}
        onClick={() => handleOpenChange(false)}
      >
        {t("metadataCancel")}
      </Button>
      <Button type="submit" className="rounded-md" disabled={!canSave}>
        {pending ? t("saving") : t("metadataSave")}
      </Button>
    </>
  );

  const sheetOutsideHandlers = getMobileSheetOutsideDismissHandlers(ignoreOutsideDismissRef);

  const mobileSheetStyle: CSSProperties | undefined =
    keyboardInset > 0
      ? {
          bottom: keyboardInset,
          maxHeight: `calc(100dvh - ${keyboardInset}px)`,
        }
      : undefined;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          className="z-[80] h-auto max-h-[min(90dvh,100%)] gap-0 rounded-t-md p-0"
          overlayClassName="z-[80]"
          showCloseButton
          style={mobileSheetStyle}
          onOpenAutoFocus={(event) => event.preventDefault()}
          {...sheetOutsideHandlers}
        >
          <SheetHeader className="border-b border-border/60 px-5 pt-5 pb-4 text-left">
            <SheetTitle>{t("metadataTitle")}</SheetTitle>
            <SheetDescription>{t("metadataDescription")}</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{formFields}</div>
            <SheetFooter className="border-t border-border/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {actionButtons}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="rounded-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("metadataTitle")}</DialogTitle>
          <DialogDescription>{t("metadataDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields}
          <DialogFooter className={cn("gap-2 sm:gap-2")}>{actionButtons}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
