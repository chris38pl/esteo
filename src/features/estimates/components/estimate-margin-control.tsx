"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  parseEstimateDecimalInput,
  roundEstimateDecimal,
} from "@/features/estimates/lib/estimate-decimals";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";

interface EstimateMarginControlProps {
  marginPercent: number;
  onChange: (value: number) => void;
  onBlur: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function EstimateMarginControl({
  marginPercent,
  onChange,
  onBlur,
  disabled = false,
  className,
}: EstimateMarginControlProps) {
  const t = useTranslations("estimates");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseEstimateDecimalInput(e.target.value);
    if (num >= 0 && num <= 100) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    const num = roundEstimateDecimal(marginPercent);
    if (num < 0 || num > 100) {
      return;
    }
    if (num !== marginPercent) {
      onChange(num);
    }
    onBlur(num);
  };

  return (
    <div
      className={cn(
        estimateOutlineButtonClassName,
        "inline-flex px-4",
        className,
      )}
    >
      <Label className="whitespace-nowrap text-sm font-semibold">
        {t("profitability.projectMargin")}
      </Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={marginPercent}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="h-7 w-14 border-transparent bg-transparent px-1 text-right text-sm font-semibold text-current shadow-none focus-visible:ring-0"
        />
        <span className="text-sm font-semibold text-current">{t("margin.unit")}</span>
      </div>
    </div>
  );
}
