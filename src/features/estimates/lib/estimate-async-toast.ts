import { toast } from "sonner";

export const ESTIMATE_ASYNC_TOAST_POSITION = "bottom-center" as const;

export function estimateSendToastId(sendId: string): string {
  return `estimate-send:${sendId}`;
}

export function showEstimateAsyncLoading(
  id: string,
  title: string,
  description?: string,
): void {
  toast.loading(title, {
    id,
    description,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
    duration: Infinity,
  });
}

export function updateEstimateAsyncLoading(
  id: string,
  title: string,
  description?: string,
): void {
  toast.loading(title, {
    id,
    description,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
    duration: Infinity,
  });
}

export function completeEstimateAsyncSuccess(
  id: string,
  title: string,
  description?: string,
): void {
  toast.success(title, {
    id,
    description,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
    duration: 5000,
  });
}

export function completeEstimateAsyncError(
  id: string,
  title: string,
  description?: string,
): void {
  toast.error(title, {
    id,
    description,
    position: ESTIMATE_ASYNC_TOAST_POSITION,
    duration: 8000,
  });
}

export function dismissEstimateAsyncToast(id: string): void {
  toast.dismiss(id);
}
