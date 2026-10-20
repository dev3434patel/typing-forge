import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccuracyChallenge } from "@/components/typing/AccuracyChallenge";
import { createAccuracyChallenge } from "../accuracy-challenge";

describe("accuracy challenge presentation", () => {
  it("labels character attempts including spaces and exposes bounded progress", () => {
    const html = renderToStaticMarkup(
      <AccuracyChallenge
        state={{ ...createAccuracyChallenge("one"), current: 4, best: 4 }}
      />,
    );
    expect(html).toContain("25 correct characters in a row, including spaces.");
    expect(html).toContain('aria-valuenow="4"');
    expect(html).toContain('aria-valuemax="25"');
    expect(html).not.toContain("keystrokes");
    expect(html).not.toContain("transition");
    expect(html).not.toContain("animate");
  });

  it("shows the best observed chain in the finished summary", () => {
    const html = renderToStaticMarkup(
      <AccuracyChallenge
        finished
        state={{ ...createAccuracyChallenge("one"), current: 2, best: 18 }}
      />,
    );
    expect(html).toContain("Best chain: 18 of 25 correct characters.");
    expect(html).toContain('aria-valuenow="18"');
  });

  it("keeps an achieved goal visible without changing the result metrics", () => {
    const html = renderToStaticMarkup(
      <AccuracyChallenge
        finished
        state={{
          ...createAccuracyChallenge("one"),
          current: 0,
          best: 25,
          completed: true,
        }}
      />,
    );
    expect(html).toContain("25 correct characters in a row. Goal complete.");
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain("Accuracy goal complete.");
    expect(html).toContain("original attempt evidence");
  });
});
