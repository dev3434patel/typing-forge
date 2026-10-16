import type { PerspectiveCamera } from "three";

/** Reserve the existing wordmark area without tilting or shrinking the product. */
export function frameOpeningKeyboard(
  camera: PerspectiveCamera,
  width: number,
  height: number,
) {
  const aspect = width / height;
  // Four-degree pointer parallax needs a little more room than the neutral pose.
  // Positive offsetY moves the projected subject upward, preserving its size.
  const rise = aspect >= 1.1 ? (height <= 500 ? 0.22 : 0.14) : 0;
  if (rise)
    camera.setViewOffset(width, height, 0, height * rise, width, height);
  else {
    camera.aspect = aspect;
    camera.clearViewOffset();
  }
}
