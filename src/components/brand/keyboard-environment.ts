import { PMREMGenerator, type Scene, type WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** Real studio reflections are shared by mobile and desktop; post FX stay separate. */
export function createKeyboardEnvironment(
  renderer: WebGLRenderer,
  scene: Scene,
) {
  const room = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  try {
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.35;
    let disposed = false;
    return {
      dispose() {
        if (disposed) return;
        disposed = true;
        if (scene.environment === target.texture) scene.environment = null;
        target.dispose();
      },
    };
  } finally {
    room.dispose();
    generator.dispose();
  }
}
