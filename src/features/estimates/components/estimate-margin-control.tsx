"use client";



import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";



import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";



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

  const [localValue, setLocalValue] = useState(String(marginPercent));

  useEffect(() => {
    setLocalValue(String(marginPercent));
  }, [marginPercent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setLocalValue(e.target.value);

    const num = parseFloat(e.target.value);

    if (!Number.isNaN(num) && num >= 0 && num <= 100) {

      onChange(num);

    }

  };



  const handleBlur = () => {

    const num = parseFloat(localValue);

    if (Number.isNaN(num) || num < 0 || num > 100) {

      setLocalValue(String(marginPercent));

      return;

    }

    setLocalValue(String(num));

    onBlur(num);

  };



  return (

    <div className={cn("space-y-1", className)}>

      <Label className="text-xs text-muted-foreground">{t("margin.label")}</Label>

      <div className="flex items-center gap-1">

        <Input

          type="number"

          min={0}

          max={100}

          step={0.5}

          value={localValue}

          onChange={handleChange}

          onBlur={handleBlur}

          disabled={disabled}

          className="h-8 w-20 text-right text-sm"

        />

        <span className="text-sm text-muted-foreground">{t("margin.unit")}</span>

      </div>

    </div>

  );

}

