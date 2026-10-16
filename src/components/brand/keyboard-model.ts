import { BufferGeometry, Float32BufferAttribute } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { KEYBOARD_PITCH, type KeyboardKey } from "./keyboard-layout";

export const KEYCAP_HEIGHT = 0.16;
export const KEYCAP_CENTER_Y = 0.09;
export const KEYCAP_LEGEND_Y = 0.084;
const CAP_SIZE = KEYBOARD_PITCH - 0.025;

/** Shared rounded, tapered and lightly dished cap; all dimensions are world units. */
export function createKeycapGeometry(lowPower: boolean) {
  const geometry = new RoundedBoxGeometry(
    CAP_SIZE,
    KEYCAP_HEIGHT,
    CAP_SIZE,
    lowPower ? 2 : 3,
    0.028,
  );
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const half = CAP_SIZE / 2;
  for (let index = 0; index < positions.count; index++) {
    const originalY = positions.getY(index);
    const level = Math.min(
      1,
      Math.max(0, (originalY + KEYCAP_HEIGHT / 2) / KEYCAP_HEIGHT),
    );
    const taper = 1 - level * 0.055;
    const x = positions.getX(index) * taper;
    const z = positions.getZ(index) * taper;
    const top = Math.min(1, Math.max(0, (originalY - 0.035) / 0.025));
    const across = Math.max(0, 1 - (x / half) ** 2);
    const depth = Math.max(0, 1 - (z / half) ** 2);
    const dish = 0.006 * across * depth * top;
    positions.setXYZ(index, x, originalY - dish, z);
    const nx =
      normals.getX(index) / taper -
      ((0.012 * x) / (half * half)) * depth * top * normals.getY(index);
    const ny = normals.getY(index);
    const nz =
      normals.getZ(index) / taper -
      ((0.012 * z) / (half * half)) * across * top * normals.getY(index);
    const length = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(index, nx / length, ny / length, nz / length);
  }
  positions.needsUpdate = true;
  normals.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Apply to both the lit and depth material; use uniform instance scales and aKeyWidth. */
export function applyKeycapWidth(shader: { vertexShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nattribute float aKeyWidth;",
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\ntransformed.x += sign(transformed.x) * (aKeyWidth - 1.0) * ${KEYBOARD_PITCH / 2};`,
    );
}

/** A hollow, narrow perimeter light band instead of a luminous plate below the case. */
export function createUnderglowRingGeometry() {
  const width = 5.84;
  const depth = 2.14;
  const height = 0.014;
  const thickness = 0.012;
  const radius = 0.095;
  const segments = 6;
  const loop = (inset: number) => {
    const hx = width / 2 - inset;
    const hz = depth / 2 - inset;
    const r = radius - inset;
    const centers = [
      [hx - r, hz - r],
      [-hx + r, hz - r],
      [-hx + r, -hz + r],
      [hx - r, -hz + r],
    ];
    return centers.flatMap(([x, z], corner) =>
      Array.from({ length: segments + 1 }, (_, step) => {
        const angle = ((corner + step / segments) * Math.PI) / 2;
        return [x + Math.cos(angle) * r, z + Math.sin(angle) * r];
      }),
    );
  };
  const outer = loop(0);
  const inner = loop(thickness);
  const vertices: number[] = [];
  const indices: number[] = [];
  const point = (edge: number[][], index: number, y: number) => [
    edge[index][0],
    y,
    edge[index][1],
  ];
  const quad = (...points: number[][]) => {
    const first = vertices.length / 3;
    vertices.push(...points.flat());
    indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  };
  for (let index = 0; index < outer.length; index++) {
    const next = (index + 1) % outer.length;
    const top = height / 2;
    const bottom = -top;
    quad(
      point(outer, index, top),
      point(inner, index, top),
      point(inner, next, top),
      point(outer, next, top),
    );
    quad(
      point(outer, index, bottom),
      point(outer, next, bottom),
      point(inner, next, bottom),
      point(inner, index, bottom),
    );
    quad(
      point(outer, index, bottom),
      point(outer, index, top),
      point(outer, next, top),
      point(outer, next, bottom),
    );
    quad(
      point(inner, index, bottom),
      point(inner, next, bottom),
      point(inner, next, top),
      point(inner, index, top),
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export interface KeyboardLegendAtlas {
  uvOffsets: Float32Array;
  uvScales: Float32Array;
  /** Width and height per plane, in world units; never stretch the glyph aspect ratio. */
  planeSizes: Float32Array;
}

/** Canvas is supplied by the platform bridge, so the same atlas works in a worker. */
export function paintKeyboardLegends(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  keys: readonly KeyboardKey[],
  lowPower: boolean,
): KeyboardLegendAtlas {
  canvas.width = canvas.height = lowPower ? 512 : 1024;
  const context = canvas.getContext("2d") as
    CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!context) throw new Error("Keyboard legend canvas unavailable");
  const cell = canvas.width / 8;
  const padding = Math.max(2, Math.round(cell * 0.025));
  const uvOffsets = new Float32Array(keys.length * 2);
  const uvScales = new Float32Array(keys.length * 2);
  const planeSizes = new Float32Array(keys.length * 2);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  keys.forEach((key, index) => {
    const primary = key.label.length === 1;
    const fontSize = Math.round(cell * (primary ? 0.6 : 0.27));
    context.font = `500 ${fontSize}px ui-monospace, monospace`;
    const metrics = context.measureText(key.label);
    const ascent = Number.isFinite(metrics.actualBoundingBoxAscent)
      ? metrics.actualBoundingBoxAscent
      : fontSize * 0.8;
    const descent = Number.isFinite(metrics.actualBoundingBoxDescent)
      ? metrics.actualBoundingBoxDescent
      : fontSize * 0.15;
    const inkWidth = Math.max(
      1,
      metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight ||
        metrics.width,
    );
    const inkHeight = Math.max(1, ascent + descent);
    const width = Math.min(cell - 2, Math.ceil(inkWidth + padding * 2));
    const height = Math.min(cell - 2, Math.ceil(inkHeight + padding * 2));
    const centerX = (index % 8) * cell + cell / 2;
    const centerY = Math.floor(index / 8) * cell + cell / 2;
    context.fillText(key.label, centerX, centerY + (ascent - descent) / 2);
    uvOffsets[index * 2] = (centerX - width / 2) / canvas.width;
    uvOffsets[index * 2 + 1] = 1 - (centerY + height / 2) / canvas.height;
    uvScales[index * 2] = width / canvas.width;
    uvScales[index * 2 + 1] = height / canvas.height;
    // Use a common physical em: dots/dashes must stay smaller than capital letters.
    // Normalizing each crop by its ink height would inflate short punctuation.
    const emSize = primary ? 0.14 : 0.1;
    const planeHeight = (emSize * height) / fontSize;
    const planeWidth = (planeHeight * width) / height;
    const fit = Math.min(1, (key.width * KEYBOARD_PITCH - 0.065) / planeWidth);
    planeSizes[index * 2] = planeWidth * fit;
    planeSizes[index * 2 + 1] = planeHeight * fit;
  });
  return { uvOffsets, uvScales, planeSizes };
}
