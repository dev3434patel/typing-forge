import { Vector2, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

/** Desktop-only module: mobile never downloads the post-processing graph. */
export function createKeyboardBloom(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
) {
  const resources = new Set<{ dispose(): void }>();
  const own = <T extends { dispose(): void }>(resource: T): T => {
    resources.add(resource);
    return resource;
  };
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    [...resources].reverse().forEach((resource) => resource.dispose());
    resources.clear();
  };
  try {
    const size = renderer.getSize(new Vector2());
    const composer = own(new EffectComposer(renderer));
    const render = own(new RenderPass(scene, camera));
    const bloom = own(new UnrealBloomPass(size, 0.55, 0.8, 0.82));
    const output = own(new OutputPass());
    const finish = own(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
        vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec4 source = texture2D(tDiffuse, vUv);
        vec2 offset = (vUv - 0.5) * 0.0012;
        vec3 color = vec3(
          texture2D(tDiffuse, vUv + offset).r,
          source.g,
          texture2D(tDiffuse, vUv - offset).b
        );
        float vignette = 1.0 - smoothstep(0.24, 0.75, length(vUv - 0.5)) * 0.35;
        float grain = fract(sin(dot(vUv + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        gl_FragColor = vec4(max(vec3(0.0), color * vignette + grain * 0.035 * source.a), source.a);
      }
    `,
      }),
    );
    composer.addPass(render);
    composer.addPass(bloom);
    composer.addPass(finish);
    composer.addPass(output);
    return {
      render(seconds = 0) {
        finish.uniforms.uTime.value = seconds;
        composer.render();
      },
      resize(width: number, height: number, pixelRatio: number) {
        composer.setPixelRatio(pixelRatio);
        composer.setSize(width, height);
      },
      dispose,
    };
  } catch (cause) {
    dispose();
    throw cause;
  }
}
