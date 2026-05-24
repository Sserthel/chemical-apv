import { NextResponse } from "next/server";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Manglende URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Ugyldig URL." }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Kemisk-APV/1.0 (SDS fetch for workplace assessment)",
        Accept: "application/pdf,*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      const hint =
        res.status === 404
          ? "Linket findes ikke (404). Mange SDS-sider kræver login eller blokering – download PDF i browseren og upload den manuelt i stedet."
          : `Serveren returnerede HTTP ${res.status}. Download PDF manuelt fra leverandøren og upload den.`;
      return NextResponse.json(
        {
          error: hint,
          canOpenUrl: true,
          status: res.status,
        },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length > MAX_BYTES) {
      return NextResponse.json(
        {
          error: "PDF er for stor (>12 MB). Download manuelt og upload i stedet.",
          canOpenUrl: true,
        },
        { status: 413 }
      );
    }

    const isPdf =
      contentType.toLowerCase().includes("pdf") ||
      url.toLowerCase().includes(".pdf");

    const base64 = buffer.toString("base64");
    const fileName =
      parsed.pathname.split("/").pop()?.split("?")[0] || "sds-download.pdf";

    return NextResponse.json({
      base64,
      fileName: fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      contentType: contentType || "application/pdf",
      isPdf,
      size: buffer.length,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Hentning fejlede (CORS/blokering mulig). Åbn linket i browser og upload PDF manuelt.",
        canOpenUrl: true,
      },
      { status: 500 }
    );
  }
}
