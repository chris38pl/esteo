"use client";

import { useState } from "react";
import { Check, Copy, CreditCard, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { appToast } from "@/components/ui/app-toast";

const TEST_CARD = {
  number: "4242 4242 4242 4242",
  expiry: "12 / 28",
  cvc: "424",
  name: "Esteo Test User",
} as const;

export function BillingUatTestCardHelper() {
  const t = useTranslations("billing.workspace.manage.uatTestCard");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyCardData() {
    const value = [
      `${t("copyPayload.number")}: ${TEST_CARD.number}`,
      `${t("copyPayload.expiry")}: ${TEST_CARD.expiry}`,
      `${t("copyPayload.cvc")}: ${TEST_CARD.cvc}`,
      `${t("copyPayload.name")}: ${TEST_CARD.name}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      appToast.success(t("copySuccess"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      appToast.error(t("copyError"));
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes uat-test-card-fab-pulse {
  0%, 100% {
    opacity: 0.45;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.12);
  }
}
.uat-test-card-fab-pulse {
  animation: uat-test-card-fab-pulse 2.8s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .uat-test-card-fab-pulse {
    animation: none;
    opacity: 0.55;
  }
}
`,
        }}
      />
      <div className="fixed top-1/2 right-3 z-[70] flex -translate-y-1/2 flex-col items-end sm:right-5">
      {open ? (
        <section
          id="uat-test-card-helper"
          className="mb-3 w-[calc(100vw-1.5rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-blue-400/20 bg-slate-950/95 text-white shadow-2xl shadow-blue-950/40 ring-1 ring-white/10 backdrop-blur-xl sm:w-[22rem]"
          aria-label={t("panelLabel")}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold tracking-tight">{t("title")}</p>
              <p className="mt-0.5 text-xs text-blue-100/70">{t("subtitle")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-blue-100/80 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>

          <div className="space-y-3 p-4">
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-4 shadow-lg shadow-blue-950/30">
              <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-14 left-6 size-28 rounded-full bg-cyan-300/20 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium text-blue-50/80">{t("cardLabel")}</p>
                  <p className="mt-1 text-sm font-semibold tracking-tight">{t("cardBrand")}</p>
                </div>
                <p className="text-lg font-black italic tracking-tight">VISA</p>
              </div>

              <p className="relative mt-6 text-lg font-semibold tracking-[0.08em] tabular-nums">
                {TEST_CARD.number}
              </p>

              <div className="relative mt-5 grid grid-cols-3 gap-3 text-[10px] uppercase tracking-[0.14em] text-blue-50/65">
                <div>
                  <p>{t("expiryLabel")}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-white">
                    {TEST_CARD.expiry}
                  </p>
                </div>
                <div>
                  <p>{t("cvcLabel")}</p>
                  <p className="mt-1 text-xs font-semibold tracking-normal text-white">{TEST_CARD.cvc}</p>
                </div>
                <div>
                  <p>{t("nameLabel")}</p>
                  <p className="mt-1 truncate text-xs font-semibold normal-case tracking-normal text-white">
                    {TEST_CARD.name}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={() => void copyCardData()}
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? t("copiedButton") : t("copyButton")}
            </Button>

            <p className="flex gap-2 text-xs leading-relaxed text-blue-100/65">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("footnote")}
            </p>
          </div>
        </section>
      ) : null}

      <div className="relative">
        {!open ? (
          <span
            className="uat-test-card-fab-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-blue-300/80"
            aria-hidden
          />
        ) : null}
        <Button
          type="button"
          size="icon-lg"
          className="relative flex rounded-full bg-blue-600 text-white ring-1 ring-white/20 hover:bg-blue-500"
          onClick={() => setOpen((current) => !current)}
          aria-controls="uat-test-card-helper"
          aria-expanded={open}
          aria-label={open ? t("hide") : t("show")}
        >
          <CreditCard className="size-5" aria-hidden />
        </Button>
      </div>
    </div>
    </>
  );
}
