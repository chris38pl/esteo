export interface StorageUploadResult {
  key: string;
  /** Public CDN URL returned by UploadThing (when available). */
  url?: string;
}

export interface StorageProvider {
  upload(params: {
    /** Logical storage path — logging/diagnostics only. */
    key: string;
    /** Short identifier sent to UploadThing as customId. */
    customId: string;
    body: Buffer;
    mimeType: string;
    fileName: string;
    /** 1-based index for temporary UploadThing upload diagnostics. */
    fileIndex?: number;
  }): Promise<StorageUploadResult>;

  delete(keys: string[]): Promise<void>;

  getSignedUrl(key: string, opts?: { expiresInSeconds?: number }): Promise<string>;

  download(key: string): Promise<Buffer>;
}
