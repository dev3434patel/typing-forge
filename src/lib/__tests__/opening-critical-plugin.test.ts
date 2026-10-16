import { describe, expect, it } from "vitest";
import {
  inlineOpeningStyles,
  rebaseFontUrls,
} from "../../../build/opening-critical-plugin";

describe("opening critical styles", () => {
  it("inlines initial opening CSS and fonts while preserving deferred application CSS", () => {
    const result = inlineOpeningStyles(
      '<link rel="stylesheet" href="/fonts/fonts.css"><link crossorigin rel="stylesheet" href="/assets/opening-a.css"><link rel="stylesheet" href="/assets/app-b.css">',
      [
        {
          fileName: "assets/opening-a.css",
          source: ".awakening{color:white}.awakening-title{top:64%}",
        },
        { fileName: "assets/app-b.css", source: ".forge-main{display:block}" },
      ],
      "@font-face{src:url(./sora.woff2)}",
    );
    expect(result).toContain("<style data-opening-critical>.awakening");
    expect(result).toContain(
      "<style data-inline-fonts>@font-face{src:url(/fonts/sora.woff2)}",
    );
    expect(result).toContain('href="/assets/app-b.css"');
    expect(result).not.toContain('href="/assets/opening-a.css"');
    expect(result).not.toContain('href="/fonts/fonts.css"');
  });

  it("rebases unchanged font face URLs for a deployment prefix without changing local/data sources", () => {
    expect(
      rebaseFontUrls(
        "src:url('./sora.woff2'),url(./inter.woff2),local('Arial'),url(data:font/woff2;base64,abc)",
        "/practice/",
      ),
    ).toBe(
      "src:url('/practice/fonts/sora.woff2'),url(/practice/fonts/inter.woff2),local('Arial'),url(data:font/woff2;base64,abc)",
    );
  });

  it("leaves unknown links and application CSS intact and escapes raw HTML terminators", () => {
    const result = inlineOpeningStyles(
      '<link rel="preload" href="/assets/opening.css"><link rel="stylesheet" href="/assets/opening.css"><link rel="stylesheet" href="/assets/combined.css">',
      [
        {
          fileName: "assets/opening.css",
          source: '.awakening-title{--label:"</style>"}',
        },
        {
          fileName: "assets/combined.css",
          source: ".awakening-title{}.forge-main{}",
        },
      ],
      "",
    );
    expect(result).toContain('rel="preload"');
    expect(result).toContain('href="/assets/combined.css"');
    expect(result).toContain("<\\/style>");
  });
});
