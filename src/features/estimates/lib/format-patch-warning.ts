import type { PatchValidationWarning } from "@/features/estimates/lib/estimate-agent-types";
import type { Locale } from "@/lib/locale";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function formatMoney(value: number, locale: Locale, currency = "PLN"): string {
  return `${value.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currency}`;
}

function resolveWarningParams(
  warning: PatchValidationWarning,
  locale: Locale,
): Record<string, string | number> | undefined {
  if (!warning.params) {
    return undefined;
  }

  if (warning.code === "target_gross_missed") {
    const currency =
      typeof warning.params.currency === "string" ? warning.params.currency : "PLN";
    return {
      afterGross: formatMoney(Number(warning.params.afterGross), locale, currency),
      targetGross: formatMoney(Number(warning.params.targetGross), locale, currency),
    };
  }

  return warning.params;
}

export function formatPatchWarning(
  warning: PatchValidationWarning,
  t: TranslateFn,
  locale: Locale,
): string {
  const params = resolveWarningParams(warning, locale);

  if (params) {
    return t(`ai.warnings.${warning.code}`, params);
  }

  return warning.message ?? t(`ai.warnings.${warning.code}`);
}
