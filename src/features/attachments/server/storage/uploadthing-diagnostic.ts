import "server-only";

import { writeFile } from "fs/promises";
import os from "os";
import path from "path";

import type { FetchEsque } from "@uploadthing/shared";

/** Outside project cwd so Next.js dev file watcher does not recompile on each upload log write. */
const LOG_FILE = path.join(os.tmpdir(), "esteo-ut-upload-debug.jsonl");

type UploadDiagnosticBatchContext = {
  requestId: string;
  workspaceId: string;
  totalFiles: number;
};

let currentBatchContext: UploadDiagnosticBatchContext | null = null;
let diagnosticLogLines: string[] = [];

/**
 * Dev-only upload diagnostics. Disabled on Vercel staging/production (NODE_ENV !== "development").
 * Set UPLOADTHING_UPLOAD_DEBUG=0 to disable locally.
 */
export function isUploadThingUploadDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (process.env.UPLOADTHING_UPLOAD_DEBUG === "0") {
    return false;
  }

  return true;
}

export function getUploadDiagnosticLogPath(): string {
  return LOG_FILE;
}

function resetDiagnosticLogFile(): void {
  diagnosticLogLines = [];

  if (!isUploadThingUploadDebugEnabled()) {
    return;
  }

  void writeFile(LOG_FILE, "", "utf8").catch((error) => {
      console.error("[UT upload] failed to reset diagnostic log file", {
        logFile: LOG_FILE,
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

export function setUploadDiagnosticBatchContext(context: UploadDiagnosticBatchContext | null): void {
  const previousContext = currentBatchContext;
  currentBatchContext = context;

  if (context && !previousContext) {
    resetDiagnosticLogFile();
  }
}

export function serializeUnknownForLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function persistDiagnosticLogLines(): void {
  void writeFile(LOG_FILE, `${diagnosticLogLines.join("\n")}\n`, "utf8").catch((error) => {
      console.error("[UT upload] failed to write diagnostic log file", {
        logFile: LOG_FILE,
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

function appendUploadDiagnosticLogLine(entry: Record<string, unknown>): void {
  if (!isUploadThingUploadDebugEnabled()) {
    return;
  }

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    batch: currentBatchContext,
    ...entry,
  });

  diagnosticLogLines.push(line);
  persistDiagnosticLogLines();
}

export function logUploadThingDiagnostic(
  event: string,
  payload: Record<string, unknown>,
  options?: { echoToConsole?: boolean },
): void {
  if (!isUploadThingUploadDebugEnabled()) {
    return;
  }

  appendUploadDiagnosticLogLine({ event, ...payload });

  const shouldEcho =
    options?.echoToConsole ??
    (event.includes("failure") ||
      event.includes("batch") ||
      event === "request file start" ||
      event === "request file success");

  if (shouldEcho) {
    console.info(`[UT upload] ${event}`, payload);
  }
}

/**
 * Wraps fetch to capture HTTP status + body for UploadThing API calls.
 * Dev-only diagnostic aid — gated by isUploadThingUploadDebugEnabled().
 */
export function createUploadThingDiagnosticFetch(baseFetch: FetchEsque = fetch): FetchEsque {
  return async (input, init) => {
    const startedAt = Date.now();
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    logUploadThingDiagnostic("http request start", {
      method: init?.method ?? "GET",
      url,
    });

    const response = await baseFetch(input, init);
    const durationMs = Date.now() - startedAt;

    let responseBody: unknown = null;

    try {
      const text = await response.clone().text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text.length > 8000 ? `${text.slice(0, 8000)}…[truncated]` : text;
      }
    } catch (readError) {
      responseBody = {
        readError: readError instanceof Error ? readError.message : String(readError),
      };
    }

    const rateLimitHeaders = {
      limit: response.headers.get("ratelimit-limit"),
      remaining: response.headers.get("ratelimit-remaining"),
      reset: response.headers.get("ratelimit-reset"),
      retryAfter: response.headers.get("retry-after"),
    };

    logUploadThingDiagnostic(
      "http response",
      {
        url,
        statusCode: response.status,
        statusText: response.statusText,
        durationMs,
        rateLimitHeaders,
        responseBody: serializeUnknownForLog(responseBody),
      },
      { echoToConsole: !response.ok },
    );

    return response;
  };
}

