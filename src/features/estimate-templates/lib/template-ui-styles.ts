import { APP_TOAST_VARIANTS } from "@/components/ui/app-toast/app-toast-variants";
import { cn } from "@/lib/utils";

const successToast = APP_TOAST_VARIANTS.success;

/** Matches app success toast chip colors (light + dark). */
export const templateDefaultBadgeColors = cn(
  "border",
  successToast.iconWrapClassName,
  successToast.iconClassName,
  successToast.borderClassName,
  "hover:opacity-100",
);
