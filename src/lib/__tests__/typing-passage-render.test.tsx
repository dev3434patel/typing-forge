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

  it("preserves independent pace, opponent and after-slot annotations around the real caret", () => {
    const source = slots("cat dog");
    source[0] = { ...source[0], typed: "c", status: "correct" };
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={source}
        cursor={1}
        marker={<i data-test-marker />}
        characterClassName={(slot) =>
          slot.status === "untyped" && slot.index < 4
            ? "opponent-passed"
            : undefined
        }
        renderBefore={(slot) =>
          slot.index === 2 ? <i data-pace-marker /> : null
        }
        renderAfter={(slot) =>
          slot.index === 4 ? <small data-after-slot>next</small> : null
        }
      />,
    );
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html.match(/data-pace-marker/g)).toHaveLength(1);
    expect(html.match(/opponent-passed/g)).toHaveLength(3);
    expect(html.indexOf("data-test-marker")).toBeLessThan(
      html.indexOf("data-pace-marker"),
    );
    expect(html.indexOf("data-after-slot")).toBeGreaterThan(
      html.indexOf('data-slot-index="4"'),
    );
    expect(html.indexOf("data-after-slot")).toBeLessThan(
      html.indexOf('data-slot-index="5"'),
    );
    expect(html).toContain('class="typing-character char-correct"');
  });

  it("retains composed graphemes and code line breaks while annotations change", () => {
    const result = alignTranscript(
      graphemes("é\nकिताब"),
      graphemes("é\n"),
      "code",
    );
    const html = renderToStaticMarkup(
      <TypingPassage
        slots={result.characters}
        cursor={result.cursor}
        preserveWhitespace
        marker={<i data-test-marker />}
        renderBefore={(slot) =>
          slot.index === result.cursor ? <i data-pace-marker /> : null
        }
      />,
    );
    expect(html.match(/data-test-marker/g)).toHaveLength(1);
    expect(html.match(/data-pace-marker/g)).toHaveLength(1);
    expect(html.match(/<br\/?\s*>/g)).toHaveLength(1);
    expect(html).toContain('<span data-typed-glyph="true">é</span>');
    expect(html).toContain('<span data-typed-glyph="true">↵</span>');
    expect(html).toContain('data-current="true" data-slot-index="2"');
    expect(html).not.toContain("data-typing-word");
  });
});
