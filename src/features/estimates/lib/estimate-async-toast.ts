import { appToast } from "@/components/ui/app-toast";

export const ESTIMATE_ASYNC_TOAST_POSITION = "bottom-center" as const;

export function estimateSendToastId(sendId: string): string {
  return `estimate-send:${sendId}`;
}

export function showEstimateAsyncLoading(
  id: string,
  title: string,
  description?: string,
): void {
  appToast.loading(title, {
    id,
    description,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
  });
}

export function updateEstimateAsyncLoading(
  id: string,
  title: string,
  description?: string,
): void {
  appToast.update(id, {
    variant: "loading",
    title,
    description,
    duration: Infinity,
    showProgress: false,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
  });
}

export function completeEstimateAsyncSuccess(
  id: string,
  title: string,
  description?: string,
): void {
  appToast.update(id, {
    variant: "success",
    title,
    description,
    duration: 5000,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
  });
}

export function completeEstimateAsyncError(
  id: string,
  title: string,
  description?: string,
): void {
  appToast.update(id, {
    variant: "error",
    title,
    description,
    duration: 8000,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
  });
}

export function dismissEstimateAsyncToast(id: string): void {
  appToast.dismiss(id);
}
