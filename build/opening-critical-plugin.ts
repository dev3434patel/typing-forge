import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

type StyleAsset = { fileName: string; source: string };

function inlineStyle(css: string, marker: string) {
  // A stylesheet is raw text inside HTML, so an accidental closing tag must
  // never end the style element. This does not change ordinary CSS content.
  return `<style ${marker}>${css.replace(/<\/style/gi, "<\\/style")}</style>`;
}

export function rebaseFontUrls(css: string, base: string) {
  const fontRoot = `${base.endsWith("/") ? base : `${base}/`}fonts/`;
  return css.replace(
    /url\(\s*(["']?)(\.\/[^\s)"']+)\1\s*\)/g,
    (_match, quote: string, relative: string) =>
      `url(${quote}${fontRoot}${relative.slice(2)}${quote})`,
  );
}

/** Inline only first-load opening styles; lazy application CSS stays deferred. */
export function inlineOpeningStyles(
  html: string,
  styles: readonly StyleAsset[],
  fontCss: string,
  base = "/",
) {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const byHref = new Map(
    styles.map((asset) => [`${prefix}${asset.fileName}`, asset.source]),
  );
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) return tag;
    // Vite leaves public stylesheet URLs unchanged, including their base.
    if (href === `${prefix}fonts/fonts.css` || href === "/fonts/fonts.css")
      return inlineStyle(rebaseFontUrls(fontCss, base), "data-inline-fonts");
    const css = byHref.get(href);
    if (
      css?.includes(".awakening-title") &&
      css.includes(".awakening") &&
      !css.includes(".forge-main")
    )
      return inlineStyle(css, "data-opening-critical");
    return tag;
  });
}

export function openingCriticalPlugin(): Plugin {
  let root = "";
  let base = "/";
  return {
    name: "sparowtype-opening-critical-css",
    apply: "build",
    configResolved(config) {
      root = config.root;
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      async handler(html, context) {
        if (!context.bundle) return html;
        const styles = Object.values(context.bundle).flatMap((asset) =>
          asset.type === "asset" && asset.fileName.endsWith(".css")
            ? [
                {
                  fileName: asset.fileName,
                  source:
                    typeof asset.source === "string"
                      ? asset.source
                      : new TextDecoder().decode(asset.source),
                },
              ]
            : [],
        );
        const fontCss = await readFile(
          path.join(root, "public", "fonts", "fonts.css"),
          "utf8",
        );
        return inlineOpeningStyles(html, styles, fontCss, base);
      },
    },
  };
}
