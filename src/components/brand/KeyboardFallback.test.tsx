import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KeyboardFallback } from "./KeyboardFallback";

describe("complete keyboard fallback", () => {
  it("renders all 61 physical ANSI keys with their actual modifier widths and positions", () => {
    const html = renderToStaticMarkup(<KeyboardFallback pressedKey={null} />);
    expect(html.match(/class="awakening-key"/g)).toHaveLength(61);
    expect(html.match(/data-press="false"/g)).toHaveLength(61);
    expect(html).toContain("--key-width:6.25");
    expect(html).toContain("--key-width:2.75");
    expect(html).toContain("--key-index:60;");
    expect(html).toContain(">Space</span>");
    expect(html).toContain(">Enter</span>");
  });

  it("presses the actual letter while leaving all other physical keys released", () => {
    for (const letter of ["S", "P", "A", "R", "O", "W", "T", "Y", "E"]) {
      const html = renderToStaticMarkup(
        <KeyboardFallback pressedKey={letter} />,
      );
      expect(html.match(/data-press="true"/g)).toHaveLength(1);
      expect(html.match(/data-press="false"/g)).toHaveLength(60);
      expect(html).toMatch(
        new RegExp(`data-press="true"[^>]*>${letter}</span>`),
      );
    }
  });

  it("keeps a complete neutral board when no corresponding physical key is requested", () => {
    const html = renderToStaticMarkup(
      <KeyboardFallback pressedKey="unmapped" />,
    );
    expect(html.match(/class="awakening-key"/g)).toHaveLength(61);
    expect(html).not.toContain('data-press="true"');
  });
});
