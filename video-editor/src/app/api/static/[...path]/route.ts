import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const VIDEO_PUBLIC = path.resolve(process.cwd(), "..", "video", "public");

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/m4a",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path;
  const filePath = path.join(VIDEO_PUBLIC, ...segments);

  // Security: prevent directory traversal
  if (!filePath.startsWith(VIDEO_PUBLIC)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
