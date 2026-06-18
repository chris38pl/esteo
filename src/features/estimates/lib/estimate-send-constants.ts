import type { EstimateSendTransportStatus } from "@prisma/client";

export const SUCCESSFUL_SEND_TRANSPORT_STATUSES: EstimateSendTransportStatus[] = [
  "PROVIDER_ACCEPTED",
  "DELIVERED",
];

export const ACTIVE_SEND_TRANSPORT_STATUSES: EstimateSendTransportStatus[] = [
  "QUEUED",
  "GENERATING_PDF",
  "SENDING",
];
