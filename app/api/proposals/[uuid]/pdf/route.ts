import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { supabaseAdmin } from "@/lib/supabase";

// Puppeteer cold-start (serverless Chromium) + render + export can run a few
// seconds past Next's default route timeout — give it headroom. Actual
// ceiling is capped by whatever the hosting plan allows; this is a request,
// not a guarantee.
export const maxDuration = 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;

  if (!UUID_PATTERN.test(uuid)) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const { data: proposal, error } = await supabaseAdmin
    .from("Proposal")
    .select("id, clientName")
    .eq("id", uuid)
    .maybeSingle();

  if (error) {
    console.error("PDF export: failed to look up proposal:", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  // On Vercel, `@sparticuz/chromium` supplies a Linux binary sized for
  // serverless functions. Locally (any dev machine), that binary won't run —
  // point PUPPETEER_EXECUTABLE_PATH at a real Chrome/Chromium install instead.
  const isServerless = Boolean(process.env.VERCEL);
  const executablePath = isServerless
    ? await chromium.executablePath()
    : process.env.PUPPETEER_EXECUTABLE_PATH;

  if (!executablePath) {
    console.error(
      "PDF export: no Chromium executable available. Set PUPPETEER_EXECUTABLE_PATH for local dev.",
    );
    return NextResponse.json(
      { error: "PDF generation is not configured on this environment." },
      { status: 500 },
    );
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : [],
      // Puppeteer-core's own default viewport is narrow enough to trip the
      // page's mobile Tailwind breakpoint — force the desktop/print layout.
      defaultViewport: { width: 1240, height: 1754 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    const origin = new URL(request.url).origin;

    // print=1 renders the same template with tracking and the live
    // signature pad switched off — see app/proposals/[uuid]/page.tsx. This
    // load must never be counted as a real client visit.
    // "load" rather than "networkidle0": in Next.js dev mode the HMR
    // websocket never goes fully idle, so networkidle-based waits can hang
    // until they time out. The page has no other pending network activity
    // once loaded (the signature image, if any, is an inline data: URI).
    await page.goto(`${origin}/proposals/${uuid}?print=1`, {
      waitUntil: "load",
      timeout: 45000,
    });

    const pdfBuffer = await page.pdf({ format: "a4", printBackground: true });
    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });

    const safeName = proposal.clientName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Proposal-${safeName || uuid.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
