import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/config/site";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export type StoredMedia = {
  storageKey: string;
  url: string;
  mediaType: string;
  originalFilename: string;
  width: number | null;
  height: number | null;
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function detectMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    bytes[11] === 0x66
  ) {
    return "image/avif";
  }
  return null;
}

export function assertSafeImageUpload(file: File, bytes: Uint8Array) {
  if (file.size > MAX_UPLOAD_BYTES || bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError({
      code: "FILE_TOO_LARGE",
      publicMessage: "גודל הקובץ חורג מהמותר (5MB).",
    });
  }

  const detected = detectMime(bytes);
  if (!detected || !ALLOWED_IMAGE_MIME_TYPES.includes(detected as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new AppError({
      code: "INVALID_FILE_TYPE",
      publicMessage: "ניתן להעלות תמונות בפורמט JPG, PNG, WEBP או AVIF בלבד.",
    });
  }

  if (file.type && file.type !== detected && !(file.type === "image/jpg" && detected === "image/jpeg")) {
    throw new AppError({
      code: "INVALID_FILE_TYPE",
      publicMessage: "סוג הקובץ אינו תואם לתוכן הקובץ.",
    });
  }

  return detected;
}

export interface MediaStorage {
  put(input: {
    bytes: Uint8Array;
    mediaType: string;
    originalFilename: string;
  }): Promise<StoredMedia>;
  delete(storageKey: string): Promise<void>;
}

class LocalDiskStorage implements MediaStorage {
  async put(input: {
    bytes: Uint8Array;
    mediaType: string;
    originalFilename: string;
  }): Promise<StoredMedia> {
    const ext = MIME_TO_EXT[input.mediaType] ?? "bin";
    const storageKey = `${randomUUID()}.${ext}`;
    const filePath = path.join(
      process.cwd(),
      "storage",
      "uploads",
      /* turbopackIgnore: true */ storageKey,
    );
    await mkdir(path.join(process.cwd(), "storage", "uploads"), { recursive: true });
    await writeFile(filePath, input.bytes);
    return {
      storageKey,
      url: `/media/${storageKey}`,
      mediaType: input.mediaType,
      originalFilename: input.originalFilename,
      width: null,
      height: null,
    };
  }

  async delete(storageKey: string): Promise<void> {
    if (storageKey.includes("/") || storageKey.includes("\\") || storageKey.includes("..")) {
      throw new AppError({
        code: "INVALID_STORAGE_KEY",
        publicMessage: "מפתח המדיה אינו חוקי.",
      });
    }
    await unlink(
      path.join(process.cwd(), "storage", "uploads", /* turbopackIgnore: true */ storageKey),
    ).catch(() => undefined);
  }
}

class VercelBlobStorage implements MediaStorage {
  async put(): Promise<StoredMedia> {
    throw new AppError({
      code: "MEDIA_NOT_CONFIGURED",
      publicMessage: "אחסון הענן עדיין לא הוגדר.",
      httpStatus: 501,
    });
  }

  async delete(): Promise<void> {
    throw new AppError({
      code: "MEDIA_NOT_CONFIGURED",
      publicMessage: "אחסון הענן עדיין לא הוגדר.",
      httpStatus: 501,
    });
  }
}

export function getMediaStorage(): MediaStorage {
  if (env.MEDIA_DRIVER === "vercel-blob") {
    return new VercelBlobStorage();
  }
  return new LocalDiskStorage();
}

export function resolveLocalMediaPath(storageKey: string) {
  if (
    !storageKey ||
    storageKey.includes("/") ||
    storageKey.includes("\\") ||
    storageKey.includes("..")
  ) {
    throw new AppError({
      code: "INVALID_STORAGE_KEY",
      publicMessage: "הקובץ לא נמצא.",
      httpStatus: 404,
    });
  }
  return path.join(process.cwd(), "storage", "uploads", /* turbopackIgnore: true */ storageKey);
}
