"""Regenerate the text-only favicon with an exact Sora 700 single-letter font.

Optional asset-authoring dependencies: pip install fonttools brotli.
Normal application builds use the checked-in SVG and need neither dependency.
The font's SIL Open Font License is retained in public/fonts/sora-LICENSE.txt.
"""
import base64
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    with TTFont(root / "public/fonts/sora-latin-wght-normal.woff2") as font:
        instantiateVariableFont(font, {"wght": 700}, inplace=True)
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        authoring = subset.Subsetter(options=options)
        authoring.populate(text="S")
        authoring.subset(font)
        buffer = BytesIO()
        font.flavor = "woff2"
        font.save(buffer)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 448">\n'
            '  <title>SparowType</title>\n'
            '  <!-- Sora 700 typographic S; /fonts/sora-LICENSE.txt -->\n'
            '  <style>@font-face{font-family:Sora;src:url(data:font/woff2;base64,'
            + encoded
            + ") format('woff2');font-weight:700}text{font-family:Sora,sans-serif;font-weight:700;letter-spacing:-2px}</style>\n"
            # Identical text, metrics, hinting, positioning and colors. The other
            # characters and unused variable weights are absent from the icon.
            '  <rect width="448" height="448" rx="48" fill="#07070A"/>\n'
            '  <text x="224" y="330" text-anchor="middle" font-size="320" fill="#EDEDF2">S</text>\n'
            '</svg>\n'
        )
    (root / "public/sparowtype.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    main()
