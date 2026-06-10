import "server-only";

import { UTApi, UTFile } from "uploadthing/server";

import type { StorageProvider, StorageUploadResult } from "@/features/attachments/server/storage/types";
import {
  createUploadThingDiagnosticFetch,
  isUploadThingUploadDebugEnabled,
  logUploadThingDiagnostic,
  serializeUnknownForLog,
} from "@/features/attachments/server/storage/uploadthing-diagnostic";

function getUploadThingToken(): string {
  const token = process.env.UPLOADTHING_TOKEN;

  if (!token) {
    throw new Error("UPLOADTHING_TOKEN is not configured.");
  }

  return token;
}

let utapiInstance: UTApi | null = null;

function uploadIdLogFields(customId: string, logicalKey: string) {
  return {
    customId,
    customIdLength: customId.length,
    logicalKey,
    logicalKeyLength: logicalKey.length,
  };
}

function getUtApi(): UTApi {
  if (!utapiInstance) {
    const options: ConstructorParameters<typeof UTApi>[0] = {
      token: getUploadThingToken(),
    };

    if (isUploadThingUploadDebugEnabled()) {
      options.fetch = createUploadThingDiagnosticFetch();
      options.logLevel = "Debug";
    }

    utapiInstance = new UTApi(options);
  }

  return utapiInstance;
}

export class UploadThingStorageProvider implements StorageProvider {
  async upload(params: {
    key: string;
    customId: string;
    body: Buffer;
    mimeType: string;
    fileName: string;
    fileIndex?: number;
  }): Promise<StorageUploadResult> {
    const customId = params.customId;
    const logicalKey = params.key;
    const fileLabel =
      params.fileIndex !== undefined ? `file #${params.fileIndex}` : "file";

    logUploadThingDiagnostic("upload start", {
      fileLabel,
      fileName: params.fileName,
      ...uploadIdLogFields(customId, logicalKey),
      mimeType: params.mimeType,
      byteLength: params.body.length,
      uploadStarted: new Date().toISOString(),
    });

    const utapi = getUtApi();
    const file = new UTFile([new Uint8Array(params.body)], params.fileName, {
      type: params.mimeType,
      customId,
    });

    const startedAt = Date.now();

    let results: Awaited<ReturnType<UTApi["uploadFiles"]>>;

    try {
      results = await utapi.uploadFiles([file]);
    } catch (uploadError) {
      const durationMs = Date.now() - startedAt;

      logUploadThingDiagnostic("upload threw", {
        fileLabel,
        fileName: params.fileName,
        ...uploadIdLogFields(customId, logicalKey),
        durationMs,
        uploadFailed: new Date().toISOString(),
        thrownError: serializeUnknownForLog(uploadError),
      });

      throw uploadError;
    }

    const durationMs = Date.now() - startedAt;

    logUploadThingDiagnostic("uploadFiles raw result", {
      fileLabel,
      ...uploadIdLogFields(customId, logicalKey),
      durationMs,
      results: serializeUnknownForLog(results),
    });

    if (!results || (Array.isArray(results) && results.length === 0)) {
      logUploadThingDiagnostic("upload failure", {
        fileLabel,
        ...uploadIdLogFields(customId, logicalKey),
        durationMs,
        uploadFailed: new Date().toISOString(),
        reason: "empty_results",
      });

      throw new Error("UploadThing returned no upload result.");
    }

    const first = Array.isArray(results) ? results[0] : results;

    if (first.error) {
      logUploadThingDiagnostic(
        "upload failure",
        {
          fileLabel,
          fileName: params.fileName,
          ...uploadIdLogFields(customId, logicalKey),
          durationMs,
          uploadFailed: new Date().toISOString(),
          firstError: serializeUnknownForLog(first.error),
          firstErrorCode: first.error.code,
          firstErrorMessage: first.error.message,
          firstErrorData: serializeUnknownForLog(first.error.data),
          fullFirstResult: serializeUnknownForLog(first),
        },
        { echoToConsole: true },
      );

      const errorSummary = `[${first.error.code}] ${first.error.message}`;
      throw new Error(errorSummary);
    }

    const uploadedKey = first.data?.key ?? params.key;
    const uploadedUrl =
      typeof first.data?.url === "string" && first.data.url.length > 0
        ? first.data.url
        : typeof first.data?.ufsUrl === "string" && first.data.ufsUrl.length > 0
          ? first.data.ufsUrl
          : undefined;

    logUploadThingDiagnostic("upload success", {
      fileLabel,
      fileName: params.fileName,
      ...uploadIdLogFields(customId, logicalKey),
      durationMs,
      uploadSucceeded: new Date().toISOString(),
      utFileKey: first.data?.key,
      utCustomId: first.data?.customId,
      utFileUrl: uploadedUrl,
      fullFirstResult: serializeUnknownForLog(first),
    });

    return {
      key: uploadedKey,
      customId: first.data?.customId ?? customId,
      url: uploadedUrl,
    };
  }

  async delete(keys: string[], opts?: { keyType?: "fileKey" | "customId" }): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const utapi = getUtApi();
    const keyType = opts?.keyType ?? "fileKey";
    await utapi.deleteFiles(keys, { keyType });
  }

  async getSignedUrl(key: string, opts?: { expiresInSeconds?: number }): Promise<string> {
    const utapi = getUtApi();
    const expiresIn = opts?.expiresInSeconds ?? 15 * 60;
    const result = await utapi.generateSignedURL(key, { expiresIn });

    return result.ufsUrl;
  }

  async download(key: string): Promise<Buffer> {
    const url = await this.getSignedUrl(key, { expiresInSeconds: 15 * 60 });
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file from storage (${response.status}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const uploadThingStorageProvider = new UploadThingStorageProvider();
