"use client";

import type { ReactNode } from "react";

import {
  estimateRequestFieldClassName,
  estimateRequestLabelClassName,
} from "@/features/estimate-requests/components/estimate-request-form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export { estimateRequestFieldClassName as issueFormFieldClassName };
export { estimateRequestLabelClassName as issueFormLabelClassName };

export function IssueFormTextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={estimateRequestLabelClassName}>
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(estimateRequestFieldClassName, icon && "pl-9")}
        />
      </div>
    </div>
  );
}

export function IssueFormTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  required,
  disabled,
  rows = 4,
  className,
  headerAction,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
  headerAction?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className={estimateRequestLabelClassName}>
          {label}
          {required ? <span className="text-primary">*</span> : null}
        </Label>
        {headerAction}
      </div>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={cn(
            "min-h-28 w-full resize-y rounded-xl border border-input bg-background/80 py-3 text-sm text-foreground shadow-xs outline-none dark:bg-input/30",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9 pr-3",
            !icon && "px-3",
            className,
          )}
        />
      </div>
    </div>
  );
}

export function IssueFormSelect<T extends string>({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  icon,
  required,
  disabled,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={estimateRequestLabelClassName}>
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Select value={value} onValueChange={(next) => onValueChange(next as T)} disabled={disabled}>
          <SelectTrigger
            id={id}
            className={cn(
              estimateRequestFieldClassName,
              "w-full",
              icon && "pl-9 [&>span]:text-left",
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
