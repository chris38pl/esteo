import { cn } from "@/lib/utils";

type MarketingPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string;
  centered?: boolean;
};

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  centered = false,
}: MarketingPageHeaderProps) {
  return (
    <header className={cn("space-y-4", centered && "mx-auto max-w-3xl text-center")}>
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-pretty text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7",
            centered && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      ) : null}
      {subtitle ? (
        <p
          className={cn(
            "text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7",
            centered && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
