import type { LegalPageContent } from "@/features/marketing/content/legal-content";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";

export function LegalDocument({ content }: { content: LegalPageContent }) {
  return (
    <article className="space-y-8">
      <MarketingPageHeader title={content.pageTitle} description={content.pageDescription} />

      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
        {content.draftNotice}
      </p>

      <p className="text-xs text-muted-foreground">
        {content.lastUpdated}
      </p>

      <div className="space-y-8">
        {content.sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 text-muted-foreground sm:text-[0.9375rem]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
