import { expect, type Page } from "@playwright/test";

const layoutFonts = [
  {
    family: "Inter Variable",
    font: '400 16px "Inter Variable"',
    text: "SparowType",
  },
  { family: "Sora", font: '600 24px "Sora"', text: "Guest workspace" },
  {
    family: "JetBrains Mono Variable",
    font: '400 26px "JetBrains Mono Variable"',
    text: "typing practice",
  },
];

/**
 * Wait for successful loads of the actual faces, then allow their layout to paint.
 * A paused Playwright clock must provide a callback that advances at least two frames.
 */
export async function waitForLayoutFonts(
  page: Page,
  paintFrames?: () => Promise<void>,
) {
  let deadlineId: ReturnType<typeof setTimeout> | undefined;
  let evidence: unknown = { requested: layoutFonts };
  const deadline = new Promise<never>((_, reject) => {
    // Keep the deadline in Node so a deliberately paused browser clock cannot
    // disable the ten-second font/paint budget.
    deadlineId = setTimeout(
      () =>
        reject(
          new Error(
            `Layout font loading and paint exceeded 10000ms: ${JSON.stringify(evidence)}`,
          ),
        ),
      10_000,
    );
  });
  const loadsAndPaint = async () => {
    const result = await page.evaluate(async (requests) => {
      const started = performance.now();
      const receipts: {
        family: string;
        attempt: "font-set" | "direct-face";
        fulfilledAtMs: number;
        faces: {
          family: string;
          status: FontFaceLoadStatus;
          registered: boolean;
        }[];
      }[] = [];
      const recordReceipt = (
        family: string,
        attempt: "font-set" | "direct-face",
        faces: FontFace[],
      ) => {
        const receipt = {
          family,
          attempt,
          fulfilledAtMs: performance.now() - started,
          faces: faces.map((face) => ({
            family: face.family.replace(/["']/g, ""),
            status: face.status,
            registered: document.fonts.has(face),
          })),
        };
        receipts.push(receipt);
        return receipt;
      };
      try {
        await Promise.all(
          requests.map(async (request) => {
            let faces = await document.fonts.load(request.font, request.text);
            let receipt = recordReceipt(request.family, "font-set", faces);
            if (
              !receipt.faces.length ||
              receipt.faces.some(
                (face) => face.family !== request.family || !face.registered,
              )
            ) {
              throw new Error(
                `No exact registered font receipt for ${request.family}`,
              );
            }
            if (receipt.faces.some((face) => face.status !== "loaded")) {
              // An unused WebKit face can fulfill its set load as "unloaded".
              // Retry those exact objects once; never accept that state as ready.
              faces = await Promise.all(faces.map((face) => face.load()));
              receipt = recordReceipt(request.family, "direct-face", faces);
            }
            if (
              receipt.faces.some(
                (face) =>
                  face.family !== request.family ||
                  face.status !== "loaded" ||
                  !face.registered,
              )
            ) {
              throw new Error(
                `No successful registered font receipt for ${request.family}`,
              );
            }
          }),
        );
        // WebKit can report a successfully loaded face as "unloaded" again even
        // while its painted glyph metrics match an independently loaded WOFF2.
        // Inspect the exact fulfilled receipts, not that inconsistent later state.
        return { ready: true, receipts };
      } catch (error) {
        return {
          ready: false,
          error: String(error),
          receipts,
          status: document.fonts.status,
          faces: Array.from(document.fonts).map((face) => ({
            family: face.family,
            status: face.status,
            unicodeRange: face.unicodeRange,
          })),
        };
      }
    }, layoutFonts);
    evidence = result;
    expect(
      result.ready,
      `Required layout fonts did not become ready: ${JSON.stringify(result)}`,
    ).toBe(true);
    if (paintFrames) {
      await paintFrames();
    } else {
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
    }
  };
  try {
    await Promise.race([loadsAndPaint(), deadline]);
  } finally {
    clearTimeout(deadlineId);
  }
}
