import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { resolveLocalMediaPath } from "@/domain/media/storage";

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  try {
    const filePath = resolveLocalMediaPath(key);
    const bytes = await readFile(filePath);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "הקובץ לא נמצא." }, { status: 404 });
  }
}
