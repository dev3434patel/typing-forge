import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TypingPassage } from "@/components/typing/TypingPassage";
import { alignTranscript, graphemes, type CharacterSlot } from "../typing-core";

const slots = (text: string): CharacterSlot[] =>
  graphemes(text).map((expected, index) => ({
    index,
    expected,
    typed: null,
    status: "untyped",
  }));

function render(text: string, cursor: number, preserveWhitespace = false) {
  return renderToStaticMarkup(
    <TypingPassage
      slots={slots(text)}
      cursor={cursor}
      preserveWhitespace={preserveWhitespace}
      marker={<i data-test-marker />}
    />,
  );
}

describe("typing passage cursor presentation", () => {
  it("keeps one marker at the current slot without adding passage characters", () => {
    const html = render("one two", 4);
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).toMatch(/data-current="true" data-slot-index="4"/);
    expect(html).not.toContain("data-passage-end");
    expect(html.match(/data-typing-word/g)).toHaveLength(2);
  });

  it("keeps an end caret after the final character", () => {
    const html = render("done", 4);
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).toContain('data-passage-end="true"');
    expect(html).not.toContain('data-current="true"');
  });

  it("provides a caret in an empty free-writing passage", () => {
    const html = render("", 0);
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).toContain('data-passage-end="true"');
    expect(html).not.toContain("data-typed-glyph");
  });

  it("does not add prose word wrappers or break opportunities to code", () => {
    const html = render("let a = 1;\n\ta++;", 0, true);
    expect(html).not.toContain("data-typing-word");
    expect(html).not.toContain("<wbr");
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).toContain('data-slot-index="11"');
  });

  it("retains actual wrong letters, expected hints and per-slot evidence", () => {
    const source = slots("cat dog");
    source[1] = { ...source[1], typed: "x", status: "incorrect" };
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={source}
        cursor={2}
        marker={<i data-test-marker />}
      />,
    );
    expect(html).toContain('data-typed="x" data-expected="a"');
    expect(html).toContain('<span data-typed-glyph="true">x</span>');
    expect(html).toContain('class="typing-expected-hint">a</span>');
  });

  it("draws overtyped characters before the current separator caret", () => {
    const result = alignTranscript(
      graphemes("cat dog"),
      graphemes("catxy"),
      "prose",
    );
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={result.characters}
        cursor={result.cursor}
        marker={<i data-test-marker />}
      />,
    );
    const extra = html.indexOf('data-slot-index="11"');
    const separator = html.indexOf('data-slot-index="3"');
    expect(extra).toBeGreaterThan(-1);
    expect(extra).toBeLessThan(separator);
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html.indexOf("data-test-marker")).toBeGreaterThan(extra);
    expect(html).not.toContain("data-passage-end");
  });

  it("keeps an end caret after extras rather than marking an extra as current", () => {
    const result = alignTranscript(
      graphemes("cat"),
      graphemes("catxy"),
      "prose",
    );
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={result.characters}
        cursor={result.cursor}
        marker={<i data-test-marker />}
      />,
    );
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).toContain('data-passage-end="true"');
    expect(html).not.toContain('data-current="true"');
    expect(html.indexOf("data-test-marker")).toBeGreaterThan(
      html.indexOf('data-slot-index="7"'),
    );
  });

  it("keeps the free-writing caret after all input even when cursor is zero", () => {
    const result = alignTranscript([], graphemes("a b"), "free");
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={result.characters}
        cursor={result.cursor}
        marker={<i data-test-marker />}
      />,
    );
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html).not.toContain('data-current="true"');
    expect(html.indexOf("data-test-marker")).toBeGreaterThan(
      html.indexOf('data-slot-index="2"'),
    );
  });
});
