"use client";

import type { ReactElement } from "react";
import { toast, type ExternalToast } from "sonner";

import { AppToast, type AppToastProps } from "./app-toast";
import type { AppToastAction, AppToastVariant } from "./app-toast-variants";

export type ShowAppToastOptions = {
  id?: string | number;
  variant: AppToastVariant;
  title: string;
  description?: string;
  primaryAction?: AppToastAction;
  secondaryAction?: AppToastAction;
  duration?: number;
  position?: ExternalToast["position"];
  showProgress?: boolean;
  onDismiss?: () => void;
};

const DEFAULT_DURATION_MS = 5000;

function renderAppToastContent(
  toastId: string | number,
  options: ShowAppToastOptions,
): ReactElement {
  const duration = options.duration ?? DEFAULT_DURATION_MS;

  const dismiss = () => {
    options.onDismiss?.();
    toast.dismiss(toastId);
  };

  const wrapAction = (action: AppToastAction | undefined): AppToastAction | undefined => {
    if (!action) {
      return undefined;
    }

    return {
      label: action.label,
      onClick: () => {
        action.onClick();
      },
    };
  };

  const toastProps: AppToastProps = {
    variant: options.variant,
    title: options.title,
    description: options.description,
    primaryAction: wrapAction(options.primaryAction),
    secondaryAction: wrapAction(options.secondaryAction),
    showProgress: options.showProgress ?? duration !== Infinity,
    progressDurationMs: duration,
    onDismiss: dismiss,
  };

  return <AppToast {...toastProps} />;
}

export function showAppToast(options: ShowAppToastOptions): string | number {
  const duration = options.duration ?? DEFAULT_DURATION_MS;

  return toast.custom((toastId) => renderAppToastContent(toastId, options), {
    ...(options.id != null ? { id: options.id } : {}),
    duration: duration === Infinity ? Infinity : duration,
    position: options.position ?? "top-center",
    unstyled: true,
    classNames: {
      toast:
        "group !w-[min(100vw-2rem,26rem)] !max-w-[26rem] !border-0 !bg-transparent !p-0 !shadow-none",
    },
  });
}

export function updateAppToast(
  id: string | number,
  options: ShowAppToastOptions,
): string | number {
  return showAppToast({ ...options, id });
}

export function dismissAppToast(id: string | number): void {
  toast.dismiss(id);
}

export const appToast = {
  success(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "success", title, ...options });
  },
  info(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "info", title, ...options });
  },
  warning(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "warning", title, ...options });
  },
  error(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "error", title, ...options });
  },
  celebration(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "celebration", title, ...options });
  },
  action(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({ variant: "action", title, ...options });
  },
  loading(title: string, options?: Omit<ShowAppToastOptions, "variant" | "title">) {
    return showAppToast({
      variant: "loading",
      title,
      duration: Infinity,
      showProgress: false,
      ...options,
    });
  },
  dismiss: dismissAppToast,
  update: updateAppToast,
};
