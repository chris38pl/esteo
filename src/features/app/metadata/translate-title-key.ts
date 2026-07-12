import { namespaces, type Namespace } from "@/i18n/messages";
import { getServerTranslations } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

/** Includes namespaces used in titleKey but not listed in next-intl root namespaces. */
const TITLE_KEY_NAMESPACES = [...namespaces, "navbar"] as const;

const SORTED_NAMESPACES = [...TITLE_KEY_NAMESPACES].sort((a, b) => b.length - a.length);

export function splitTitleKey(titleKey: string): { namespace: string; key: string } {
  for (const namespace of SORTED_NAMESPACES) {
    if (titleKey === namespace) {
      return { namespace, key: "" };
    }
    if (titleKey.startsWith(`${namespace}.`)) {
      return {
        namespace,
        key: titleKey.slice(namespace.length + 1),
      };
    }
  }

  throw new Error(`Unknown titleKey namespace: ${titleKey}`);
}

export async function translateTitleKey(locale: Locale, titleKey: string): Promise<string> {
  const { namespace, key } = splitTitleKey(titleKey);

  if (namespace === "navbar") {
    const { getMessages } = await import("next-intl/server");
    const messages = await getMessages({ locale });
    const navbar = messages.navbar as Record<string, unknown>;
    const value = getNestedMessageValue(navbar, key);
    if (typeof value === "string") {
      return value;
    }
    throw new Error(`Missing navbar translation for key: ${key}`);
  }

  const t = await getServerTranslations(locale, namespace as Namespace);
  const translate = t as (key: string) => string;
  return translate(key);
}

function getNestedMessageValue(source: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source);
}

export function formatWorkspaceTitle(workspaceName: string, sectionLabel: string): string {
  const trimmedWorkspace = workspaceName.trim();
  const trimmedSection = sectionLabel.trim();
  if (!trimmedWorkspace) {
    return trimmedSection;
  }
  return `${trimmedWorkspace} – ${trimmedSection}`;
}
