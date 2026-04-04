import { NextRequest } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const VIDEO_DIR = path.resolve(process.cwd(), "..", "video");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { config, outputName = "output" } = body;

  if (!config) {
    return new Response(
      JSON.stringify({ error: "No config provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const propsFile = path.join(VIDEO_DIR, `_editor-props-${Date.now()}.json`);
  const outDir = path.join(VIDEO_DIR, "out");
  const outFile = path.join(outDir, `${outputName}.mp4`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(propsFile, JSON.stringify({ config }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ log: `Starting render: ${config.title || outputName}` });
      send({ log: `Format: ${config.format}, Scenes: ${config.scenes?.length ?? 0}` });

      const child = spawn(
        "npx",
        [
          "remotion",
          "render",
          "DynamicVideo",
          outFile,
          `--props=${propsFile}`,
          "--log=verbose",
        ],
        {
          cwd: VIDEO_DIR,
          shell: true,
          env: { ...process.env },
        }
      );

      let lastProgress = 0;

      const parseLine = (line: string) => {
        const progressMatch = line.match(/(\d+)%/);
        if (progressMatch) {
          const pct = parseInt(progressMatch[1], 10) / 100;
          if (pct > lastProgress) {
            lastProgress = pct;
            send({ progress: pct });
          }
        }
        if (line.trim()) {
          send({ log: line.trim() });
        }
      };

      child.stdout?.on("data", (data: Buffer) => {
        data
          .toString()
          .split("\n")
          .forEach(parseLine);
      });

      child.stderr?.on("data", (data: Buffer) => {
        data
          .toString()
          .split("\n")
          .forEach(parseLine);
      });

      child.on("close", (code) => {
        try { fs.unlinkSync(propsFile); } catch {}

        if (code === 0) {
          send({ progress: 1, done: true, log: "Render complete!" });
          send({
            downloadUrl: `/api/render?file=${encodeURIComponent(outFile)}`,
          });
        } else {
          send({ error: `Render exited with code ${code}` });
        }
        controller.close();
      });

      child.on("error", (err) => {
        send({ error: err.message });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("file");
  if (!filePath || !fs.existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const name = path.basename(filePath);

  return new Response(buffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
