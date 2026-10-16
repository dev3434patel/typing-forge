import { describe, expect, it } from "vitest";
import {
  createKeycapGeometry,
  createUnderglowRingGeometry,
  paintKeyboardLegends,
} from "../../components/brand/keyboard-model";
import {
  KEYBOARD_KEYS,
  KEYBOARD_PITCH,
} from "../../components/brand/keyboard-layout";

describe("opening keyboard physical model", () => {
  it("uses a closed narrow perimeter band with an empty center inside the case footprint", () => {
    const ring = createUnderglowRingGeometry();
    const bounds = ring.boundingBox!;
    expect(bounds.max.x - bounds.min.x).toBeLessThan(5.86);
    expect(bounds.max.z - bounds.min.z).toBeLessThan(2.16);
    const positions = ring.getAttribute("position");
    const indices = ring.index!;
    for (let offset = 0; offset < indices.count; offset += 3) {
      const triangle = [0, 1, 2].map((step) => {
        const index = indices.getX(offset + step);
        return [positions.getX(index), positions.getZ(index)];
      });
      const crosses = triangle.map(([x, z], index) => {
        const next = triangle[(index + 1) % 3];
        return x * next[1] - z * next[0];
      });
      // Vertical band walls have no projected area. Neither top nor bottom may fill the center.
      if (Math.abs(crosses.reduce((sum, value) => sum + value, 0)) > 1e-8)
        expect(
          crosses.every((value) => value >= 0) ||
            crosses.every((value) => value <= 0),
        ).toBe(false);
    }
    ring.dispose();
  });

  it("retains a rounded, tapered physical cap and normalized smooth normals in both tiers", () => {
    for (const lowPower of [false, true]) {
      const cap = createKeycapGeometry(lowPower);
      const position = cap.getAttribute("position");
      const normal = cap.getAttribute("normal");
      const highEdges: number[] = [];
      const lowEdges: number[] = [];
      for (let index = 0; index < position.count; index++) {
        const y = position.getY(index);
        const x = Math.abs(position.getX(index));
        if (y > 0.06) highEdges.push(x);
        if (y < -0.06) lowEdges.push(x);
        expect(
          Math.hypot(
            normal.getX(index),
            normal.getY(index),
            normal.getZ(index),
          ),
        ).toBeCloseTo(1, 5);
        expect(
          Number.isFinite(position.getX(index) + y + position.getZ(index)),
        ).toBe(true);
      }
      expect(Math.max(...highEdges)).toBeLessThan(Math.max(...lowEdges));
      expect(cap.boundingBox!.max.x - cap.boundingBox!.min.x).toBeLessThan(
        KEYBOARD_PITCH,
      );
      expect(cap.boundingBox!.min.y).toBeCloseTo(-0.08);
      cap.dispose();
    }
  });

  it("fits all 61 actual-size legend rectangles in one atlas without stretching their raster aspect", () => {
    const context = {
      font: "",
      clearRect() {},
      fillText() {},
      measureText(text: string) {
        return {
          width: text.length * 9,
          actualBoundingBoxLeft: text.length * 4.5,
          actualBoundingBoxRight: text.length * 4.5,
          actualBoundingBoxAscent: 12,
          actualBoundingBoxDescent: 0,
        };
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const data = paintKeyboardLegends(canvas, KEYBOARD_KEYS, false);
    expect(data.planeSizes).toHaveLength(122);
    KEYBOARD_KEYS.forEach((key, index) => {
      const u = data.uvOffsets[index * 2];
      const v = data.uvOffsets[index * 2 + 1];
      const width = data.uvScales[index * 2];
      const height = data.uvScales[index * 2 + 1];
      expect(u).toBeGreaterThanOrEqual(0);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(u + width).toBeLessThanOrEqual(1);
      expect(v + height).toBeLessThanOrEqual(1);
      expect(
        data.planeSizes[index * 2] / data.planeSizes[index * 2 + 1],
      ).toBeCloseTo(width / height, 5);
      expect(data.planeSizes[index * 2]).toBeLessThan(
        key.width * KEYBOARD_PITCH,
      );
    });
  });

  it("keeps punctuation ink proportionate to a capital using one physical font em", () => {
    const context = {
      font: "",
      clearRect() {},
      fillText() {},
      measureText(text: string) {
        const dot = text === ".";
        return {
          width: dot ? 2 : 10,
          actualBoundingBoxLeft: dot ? 1 : 5,
          actualBoundingBoxRight: dot ? 1 : 5,
          actualBoundingBoxAscent: dot ? 2 : 14,
          actualBoundingBoxDescent: 0,
        };
      },
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const keys = ["A", "."].map((label, index) => ({
      id: String(index),
      label,
      key: label,
      x: index,
      z: 0,
      width: 1,
    }));
    const atlas = paintKeyboardLegends(canvas, keys, false);
    const capitalInkHeight =
      (atlas.planeSizes[1] * 14) / (atlas.uvScales[1] * canvas.height);
    const dotInkHeight =
      (atlas.planeSizes[3] * 2) / (atlas.uvScales[3] * canvas.height);
    expect(dotInkHeight / capitalInkHeight).toBeCloseTo(2 / 14, 5);
  });
});
