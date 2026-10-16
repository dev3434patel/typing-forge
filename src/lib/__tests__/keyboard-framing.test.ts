import { describe, expect, it } from "vitest";
import { Euler, PerspectiveCamera, Vector3 } from "three";
import { frameOpeningKeyboard } from "../../components/brand/keyboard-framing";

describe("opening keyboard framing", () => {
  it("moves the desktop subject upward without changing its size, FOV or camera pose", () => {
    const camera = new PerspectiveCamera(32, 1.44, 0.1, 80);
    const left = new Vector3(-1, 0, -5).project(camera);
    const right = new Vector3(1, 0, -5).project(camera);
    const center = new Vector3(0, 0, -5).project(camera);
    frameOpeningKeyboard(camera, 1440, 1000);
    expect(new Vector3(0, 0, -5).project(camera).y - center.y).toBeCloseTo(
      0.28,
    );
    expect(
      new Vector3(1, 0, -5).project(camera).x -
        new Vector3(-1, 0, -5).project(camera).x,
    ).toBeCloseTo(right.x - left.x);
    expect(camera.fov).toBe(32);
    expect(camera.position.toArray()).toEqual([0, 0, 0]);
    expect(camera.quaternion.toArray()).toEqual([0, 0, 0, 1]);
  });

  it("restores centered portrait projection on a real resize", () => {
    const camera = new PerspectiveCamera(32, 1, 0.1, 80);
    frameOpeningKeyboard(camera, 844, 390);
    expect(camera.view?.offsetY).toBeCloseTo(390 * 0.22);
    frameOpeningKeyboard(camera, 390, 844);
    expect(camera.view?.enabled).toBe(false);
    expect(camera.aspect).toBeCloseTo(390 / 844);
    expect(new Vector3(0, 0, -5).project(camera).y).toBeCloseTo(0);
  });

  it("keeps the settled physical board above the existing title through pointer parallax", () => {
    for (const [width, height] of [
      [1440, 1000],
      [844, 390],
    ]) {
      const titleTop = height * (height <= 500 ? 0.56 : 0.64);
      for (const pitch of [-4, 0, 4])
        for (const yaw of [-4, 0, 4]) {
          const camera = new PerspectiveCamera(32, width / height, 0.1, 80);
          camera.position
            .set(1.7, 6.1, 8.5)
            .applyEuler(
              new Euler(
                (pitch * Math.PI) / 180,
                (yaw * Math.PI) / 180,
                0,
                "YXZ",
              ),
            );
          camera.lookAt(0, 0.02, 0);
          camera.updateMatrixWorld();
          frameOpeningKeyboard(camera, width, height);
          // Conservative box also includes the cap tops and the lower shell edge.
          for (const x of [-2.94, 2.94])
            for (const z of [-1.1, 1.1])
              for (const y of [-0.3, 0.18]) {
                const point = new Vector3(x, y, z).project(camera);
                const screenY = ((1 - point.y) * height) / 2;
                expect(screenY).toBeLessThan(titleTop);
                expect(screenY).toBeGreaterThan(24);
              }
        }
    }
  });
});
