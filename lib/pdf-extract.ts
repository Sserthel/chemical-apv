"use client";

let workerReady = false;

async function ensurePdfWorker() {
  if (workerReady) return;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  workerReady = true;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  await ensurePdfWorker();
  const pdfjs = await import("pdfjs-dist");
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if ("str" in item && typeof item.str === "string") return item.str;
        return "";
      })
      .join(" ");
    parts.push(pageText);
  }

  return parts.join("\n\n");
}
