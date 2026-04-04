import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VIDEO_PUBLIC = path.resolve(process.cwd(), "..", "video", "public");
const MARKETING_DIR = path.join(VIDEO_PUBLIC, "marketing");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function listFiles(dir: string, prefix = ""): Array<{ name: string; path: string; size: number; type: string }> {
  ensureDir(dir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: Array<{ name: string; path: string; size: number; type: string }> = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, relativePath));
    } else {
      const stats = fs.statSync(fullPath);
      const ext = path.extname(entry.name).toLowerCase();
      let type = "other";
      if ([".mp4", ".webm", ".mov", ".avi"].includes(ext)) type = "video";
      else if ([".mp3", ".wav", ".ogg", ".m4a", ".aac"].includes(ext)) type = "audio";
      else if ([".png", ".jpg", ".jpeg", ".svg", ".webp"].includes(ext)) type = "image";

      files.push({
        name: entry.name,
        path: `marketing/${relativePath}`,
        size: stats.size,
        type,
      });
    }
  }

  return files;
}

export async function GET(req: NextRequest) {
  const typeFilter = req.nextUrl.searchParams.get("type");
  let files = listFiles(MARKETING_DIR);

  if (typeFilter) {
    files = files.filter((f) => f.type === typeFilter);
  }

  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  ensureDir(MARKETING_DIR);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const destPath = path.join(MARKETING_DIR, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(destPath, buffer);

  return NextResponse.json({
    path: `marketing/${safeName}`,
    name: safeName,
    size: buffer.length,
  });
}
