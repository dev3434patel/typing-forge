import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap/gsap-core";
import keyboardBloomUrl from "virtual:keyboard-bloom-url";
import { KEYBOARD_KEYS, KEYBOARD_PITCH } from "./keyboard-layout";
import { createKeyboardEnvironment } from "./keyboard-environment";
import { frameOpeningKeyboard } from "./keyboard-framing";
import {
  applyKeycapWidth,
  createKeycapGeometry,
  createUnderglowRingGeometry,
  KEYCAP_CENTER_Y,
  KEYCAP_LEGEND_Y,
  paintKeyboardLegends,
} from "./keyboard-model";

export interface KeyboardSceneDiagnostics {
  renderer: "webgl2";
  thread: "main-thread" | "worker";
  keyCount: number;
  keycapMeshes: number;
  tier: "desktop" | "mobile";
  bloom: boolean;
  environment: boolean;
  environmentIntensity: number;
  cameraElevationDegrees: number;
  pixelRatio: number;
  width: number;
  height: number;
  frames: number;
  averageFps: number;
  drawCalls: number;
  degraded: boolean;
  contextLost: boolean;
  disposed: boolean;
  asyncShaderCompile: boolean;
  shaderPreparationMs: number;
}

export interface KeyboardSceneViewport {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface KeyboardSceneOptions {
  lowPower: boolean;
  onFailure: () => void;
  onRestored?: () => void;
  onDiagnostics?: (data: KeyboardSceneDiagnostics) => void;
  onKey?: (letter: string) => void;
  onProgress?: (phase: string) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
  /** Workers receive measured CSS dimensions; neither scene path reads layout per frame. */
  viewport?: KeyboardSceneViewport;
  finePointer?: boolean;
}

export interface KeyboardSceneHandle {
  setProgress: (progress: number) => void;
  start: (elapsedMs?: number) => void;
  resize: (viewport?: KeyboardSceneViewport) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
  getDiagnostics: () => KeyboardSceneDiagnostics;
}

type BloomChain = ReturnType<
  (typeof import("./keyboard-bloom"))["createKeyboardBloom"]
>;
const WORDMARK = "SparowType";
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/** No fonts, model files, image downloads, controls or global typing listeners. */
export async function createKeyboardScene(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options: KeyboardSceneOptions,
): Promise<KeyboardSceneHandle> {
  const lowPower =
    options.lowPower ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
  const element =
    typeof HTMLCanvasElement !== "undefined" &&
    canvas instanceof HTMLCanvasElement
      ? canvas
      : null;
  const eventWindow = typeof window !== "undefined" ? window : null;
  const finePointer =
    !lowPower &&
    (options.finePointer ??
      (typeof matchMedia === "function" &&
        matchMedia("(pointer: fine)").matches));
  let viewport = options.viewport;
  const pointer = { x: 0, y: 0 };
  const pointerMoved = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const bounds = element?.getBoundingClientRect();
    if (!bounds) return;
    pointer.x = clamp(
      ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1,
      -1,
      1,
    );
    pointer.y = clamp(
      ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1,
      -1,
      1,
    );
  };
  const pointerLeft = () => {
    pointer.x = pointer.y = 0;
  };
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const shadowLights: DirectionalLight[] = [];
  const trackGeometry = <T extends BufferGeometry>(geometry: T): T => {
    geometries.add(geometry);
    return geometry;
  };
  const trackMaterial = <T extends Material>(material: T): T => {
    materials.add(material);
    return material;
  };
  const diagnostics: KeyboardSceneDiagnostics = {
    renderer: "webgl2",
    thread: element ? "main-thread" : "worker",
    keyCount: KEYBOARD_KEYS.length,
    keycapMeshes: 1,
    tier: lowPower ? "mobile" : "desktop",
    bloom: false,
    environment: false,
    environmentIntensity: 0,
    cameraElevationDegrees: 35,
    pixelRatio: Math.min(
      viewport?.pixelRatio || eventWindow?.devicePixelRatio || 1,
      lowPower ? 1 : 1.5,
    ),
    width: 1,
    height: 1,
    frames: 0,
    averageFps: 0,
    drawCalls: 0,
    degraded: false,
    contextLost: false,
    disposed: false,
    asyncShaderCompile: false,
    shaderPreparationMs: 0,
  };
  let renderer: WebGLRenderer | undefined;
  let bloom: BloomChain | undefined;
  let environment: ReturnType<typeof createKeyboardEnvironment> | undefined;
  let atlas: CanvasTexture<HTMLCanvasElement | OffscreenCanvas> | undefined;
  let observer: ResizeObserver | undefined;
  let timeline: ReturnType<typeof gsap.timeline> | undefined;
  let playing = false;
  let startedAt = 0;
  let assetFraction = 0;
  let lastFrameAt = 0;
  let sampleDuration = 0;
  let sampleFrames = 0;
  let restorePending = false;
  let renderFailed = false;
  let preparing = true;
  let renderedWidth = 0;
  let renderedHeight = 0;
  let renderedPixelRatio = 0;
  let resize = (_viewport?: KeyboardSceneViewport) => {};
  const windowResized = () => resize();
  const notify = () => options.onDiagnostics?.({ ...diagnostics });
  const snapshot = () => ({ ...diagnostics });
  const onLost = (event: Event) => {
    event.preventDefault();
    if (diagnostics.disposed) return;
    diagnostics.contextLost = true;
    renderer?.setAnimationLoop(null);
    notify();
    options.onFailure();
    // Initialization can yield while importing FX or compiling shaders. A lost
    // context at either boundary must not later publish a partially prepared scene.
    if (preparing) dispose();
  };
  const onRestored = () => {
    if (diagnostics.disposed) return;
    diagnostics.contextLost = false;
    restorePending = true;
    lastFrameAt = 0;
    renderer?.setAnimationLoop(renderFrame);
  };
  const dispose = () => {
    if (diagnostics.disposed) return;
    diagnostics.disposed = true;
    playing = false;
    timeline?.kill();
    renderer?.setAnimationLoop(null);
    observer?.disconnect();
    eventWindow?.removeEventListener("resize", windowResized);
    eventWindow?.removeEventListener("pointermove", pointerMoved);
    eventWindow?.removeEventListener("pointerleave", pointerLeft);
    eventWindow?.removeEventListener("blur", pointerLeft);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    options.signal?.removeEventListener("abort", dispose);
    bloom?.dispose();
    bloom = undefined;
    environment?.dispose();
    environment = undefined;
    keycaps?.dispose();
    legends?.dispose();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    shadowLights.forEach((light) => light.dispose());
    atlas?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    if (gsap.globalTimeline.getChildren(true, true, true).length === 0)
      gsap.ticker.sleep();
    notify();
  };
  let keycaps: InstancedMesh | undefined;
  let legends: InstancedMesh | undefined;
  let renderFrame = (_timestamp: number) => {};
  options.signal?.addEventListener("abort", dispose, { once: true });

  try {
    if (options.signal?.aborted) throw new Error("Opening cancelled");
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowPower,
      stencil: false,
      powerPreference: lowPower ? "low-power" : "high-performance",
    });
    // Own context events before the first asynchronous preparation boundary.
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const requireActivePreparation = () => {
      if (diagnostics.disposed || options.signal?.aborted)
        throw new Error("Opening cancelled during scene preparation");
      if (diagnostics.contextLost)
        throw new Error("Opening context lost during scene preparation");
    };
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.debug.onShaderError = () => {
      throw new Error("Opening shader compilation failed");
    };
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !lowPower;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.info.autoReset = false;
    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 80);
    // A restrained three-quarter product view shows the keycap walls and case depth.
    const cameraState = { x: 2.2, y: 6.2, z: 8.6 };
    const cameraOrbit = new Euler(0, 0, 0, "YXZ");
    const cameraParallax = { pitch: 0, yaw: 0 };
    if (finePointer) {
      eventWindow?.addEventListener("pointermove", pointerMoved, {
        passive: true,
      });
      eventWindow?.addEventListener("pointerleave", pointerLeft);
      eventWindow?.addEventListener("blur", pointerLeft);
    }
    camera.position.set(2.2, 6.2, 8.6);
    camera.lookAt(0, 0, 0);
    const keyboard = new Group();
    scene.add(keyboard);
    scene.add(new AmbientLight(0xffffff, 0.15));
    scene.add(new HemisphereLight(0xe8e8f6, 0x171322, 0.25));
    const keyLight = new DirectionalLight(0xffffff, 2.2);
    shadowLights.push(keyLight);
    keyLight.position.set(-3, 6, 3);
    keyLight.castShadow = !lowPower;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight);
    const rim = new DirectionalLight(0x7b61ff, 3.0);
    rim.position.set(3, 2, -4);
    scene.add(rim);
    const fill = new DirectionalLight(0xe6edff, 0.5);
    fill.position.set(0, 2, 7);
    scene.add(fill);
    environment = createKeyboardEnvironment(renderer, scene);
    diagnostics.environment = true;
    diagnostics.environmentIntensity = scene.environmentIntensity;

    const state = {
      caseOpacity: 0,
      labelOpacity: 0,
      dissolve: 0,
      drop: 0,
      seconds: 0,
    };
    const caseMaterial = trackMaterial(
      new MeshStandardMaterial({
        color: 0x0e0e14,
        metalness: 0.9,
        roughness: 0.3,
        transparent: true,
        opacity: 0,
      }),
    );
    const chassis = new Mesh(
      trackGeometry(new RoundedBoxGeometry(5.86, 0.23, 2.16, 3, 0.1)),
      caseMaterial,
    );
    chassis.position.y = -0.15;
    chassis.castShadow = !lowPower;
    chassis.receiveShadow = !lowPower;
    keyboard.add(chassis);
    const trimMaterial = trackMaterial(
      new MeshBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0 }),
    );
    const trim = new Mesh(
      trackGeometry(createUnderglowRingGeometry()),
      trimMaterial,
    );
    trim.position.y = -0.23;
    keyboard.add(trim);
    let groundMaterial: ShadowMaterial | undefined;
    if (!lowPower) {
      groundMaterial = trackMaterial(new ShadowMaterial({ opacity: 0.24 }));
      const ground = new Mesh(
        trackGeometry(new PlaneGeometry(20, 20)),
        groundMaterial,
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.295;
      ground.receiveShadow = true;
      scene.add(ground);
    }

    const capGeometry = trackGeometry(createKeycapGeometry(lowPower));
    const glowData = new Float32Array(KEYBOARD_KEYS.length);
    const seedData = Float32Array.from(
      KEYBOARD_KEYS,
      (_, index) => index * 0.137,
    );
    const glowAttribute = new InstancedBufferAttribute(glowData, 1);
    glowAttribute.setUsage(DynamicDrawUsage);
    capGeometry.setAttribute("aKeyGlow", glowAttribute);
    capGeometry.setAttribute(
      "aKeyWidth",
      new InstancedBufferAttribute(
        Float32Array.from(KEYBOARD_KEYS, (key) => key.width),
        1,
      ),
    );
    capGeometry.setAttribute(
      "aKeySeed",
      new InstancedBufferAttribute(seedData, 1),
    );
    const capParameters = { color: 0x151520, roughness: 0.38, metalness: 0.1 };
    // The low-power tier retains PBR lighting without the Physical BRDF extensions.
    // Desktop keeps the full clearcoat finish; both use the same instanced geometry.
    const capMaterial = trackMaterial(
      lowPower
        ? new MeshStandardMaterial(capParameters)
        : new MeshPhysicalMaterial({
            ...capParameters,
            clearcoat: 0.6,
            clearcoatRoughness: 0.25,
          }),
    );
    const shaderUniforms = {
      uDissolve: { value: 0 },
      uGlowColor: { value: new Color(0xc6ff3d) },
    };
    capMaterial.onBeforeCompile = (shader) => {
      applyKeycapWidth(shader);
      shader.uniforms.uDissolve = shaderUniforms.uDissolve;
      shader.uniforms.uGlowColor = shaderUniforms.uGlowColor;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `
        #include <common>
        attribute float aKeyGlow;
        attribute float aKeySeed;
        varying float vKeyGlow;
        varying float vKeySeed;
        varying vec3 vKeyPosition;
      `,
        )
        .replace(
          "#include <begin_vertex>",
          `
        #include <begin_vertex>
        vKeyGlow = aKeyGlow;
        vKeySeed = aKeySeed;
        vKeyPosition = position / vec3(0.345, 0.16, 0.345);
      `,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `
        #include <common>
        uniform float uDissolve;
        uniform vec3 uGlowColor;
        varying float vKeyGlow;
        varying float vKeySeed;
        varying vec3 vKeyPosition;
        float sparowNoise(vec3 p) {
          p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
      `,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `
        #include <emissivemap_fragment>
        float edgeGlow = 0.0;
        if (uDissolve > 0.001) {
          float grain = sparowNoise(floor(vKeyPosition * 52.0) + vKeySeed);
          if (grain < uDissolve) discard;
          edgeGlow = 1.0 - smoothstep(uDissolve, uDissolve + 0.035, grain);
        }
        totalEmissiveRadiance += uGlowColor * (vKeyGlow * 1.1 + edgeGlow * 0.85);
      `,
        );
    };
    keycaps = new InstancedMesh(capGeometry, capMaterial, KEYBOARD_KEYS.length);
    keycaps.instanceMatrix.setUsage(DynamicDrawUsage);
    keycaps.castShadow = !lowPower;
    keycaps.receiveShadow = !lowPower;
    keycaps.frustumCulled = false;
    if (!lowPower) {
      const depth = trackMaterial(
        new MeshDepthMaterial({ depthPacking: RGBADepthPacking }),
      );
      depth.onBeforeCompile = (shader) => {
        applyKeycapWidth(shader);
        shader.uniforms.uDissolve = shaderUniforms.uDissolve;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
            attribute float aKeySeed;
            varying float vKeySeed;
            varying vec3 vKeyPosition;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
            vKeySeed = aKeySeed;
            vKeyPosition = position / vec3(0.345, 0.16, 0.345);`,
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
            uniform float uDissolve;
            varying float vKeySeed;
            varying vec3 vKeyPosition;
            float sparowNoise(vec3 p) {
              p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }`,
          )
          .replace(
            "void main() {",
            `void main() {
            if (uDissolve > 0.001 &&
              sparowNoise(floor(vKeyPosition * 52.0) + vKeySeed) < uDissolve) discard;`,
          );
      };
      keycaps.customDepthMaterial = depth;
    }
    keyboard.add(keycaps);
    const baseColor = new Color(0xffffff);
    KEYBOARD_KEYS.forEach((key, index) =>
      keycaps!.setColorAt(index, baseColor),
    );
    if (keycaps.instanceColor) keycaps.instanceColor.needsUpdate = true;

    const atlasCanvas = element
      ? document.createElement("canvas")
      : new OffscreenCanvas(1, 1);
    const { uvOffsets, uvScales, planeSizes } = paintKeyboardLegends(
      atlasCanvas,
      KEYBOARD_KEYS,
      lowPower,
    );
    atlas = new CanvasTexture(atlasCanvas);
    atlas.colorSpace = SRGBColorSpace;
    atlas.minFilter = LinearFilter;
    atlas.magFilter = LinearFilter;
    atlas.generateMipmaps = false;
    const legendGeometry = trackGeometry(new PlaneGeometry(1, 1));
    legendGeometry.setAttribute(
      "aLegendOffset",
      new InstancedBufferAttribute(uvOffsets, 2),
    );
    legendGeometry.setAttribute(
      "aLegendScale",
      new InstancedBufferAttribute(uvScales, 2),
    );
    const legendMaterial = trackMaterial(
      new ShaderMaterial({
        uniforms: {
          uAtlas: { value: atlas },
          uOpacity: { value: 0 },
          uText: { value: new Color(0xf2f2fa) },
        },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        vertexShader: `
        attribute vec2 aLegendOffset;
        attribute vec2 aLegendScale;
        varying vec2 vLegendUv;
        void main() {
          vLegendUv = uv * aLegendScale + aLegendOffset;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
        fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uOpacity;
        uniform vec3 uText;
        varying vec2 vLegendUv;
        void main() {
          float alpha = texture2D(uAtlas, vLegendUv).a * uOpacity;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(uText, alpha);
          #include <colorspace_fragment>
        }
      `,
      }),
    );
    legends = new InstancedMesh(
      legendGeometry,
      legendMaterial,
      KEYBOARD_KEYS.length,
    );
    legends.instanceMatrix.setUsage(DynamicDrawUsage);
    legends.frustumCulled = false;
    keyboard.add(legends);

    const keyStates = KEYBOARD_KEYS.map(() => ({
      arrival: 0,
      press: 0,
      glow: 0,
    }));
    const curves = KEYBOARD_KEYS.map((key, index) => {
      const angle = index * 2.3999632297;
      const home = new Vector3(
        key.x * KEYBOARD_PITCH,
        KEYCAP_CENTER_Y,
        key.z * KEYBOARD_PITCH,
      );
      return new CatmullRomCurve3(
        [
          new Vector3(
            Math.cos(angle) * 5.5,
            3.2 + (index % 5) * 0.15,
            Math.sin(angle) * 4.0,
          ),
          new Vector3(
            Math.cos(angle + 1.1) * 3.8,
            2.5,
            Math.sin(angle + 1.1) * 2.8,
          ),
          new Vector3(home.x * 0.8, 0.9 + (index % 3) * 0.05, home.z * 0.7),
          new Vector3(home.x, 0.24, home.z),
          home,
        ],
        false,
        "centripetal",
      );
    });
    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();
    const rotation = new Euler();
    const quaternion = new Quaternion();
    const labelQuaternion = new Quaternion();
    const labelRotation = new Quaternion().setFromEuler(
      new Euler(-Math.PI / 2, 0, 0),
    );
    const topOffset = new Vector3();
    const pushInstances = () => {
      KEYBOARD_KEYS.forEach((key, index) => {
        const keyState = keyStates[index];
        const arrived = clamp(keyState.arrival);
        curves[index].getPoint(arrived, position);
        const settle =
          Math.sin(arrived * Math.PI * 6) * Math.exp(-arrived * 7) * 0.1;
        position.y += settle - keyState.press * 0.045;
        const spin = (1 - arrived) * Math.PI;
        rotation.set(spin * 0.2, spin * (index % 2 ? 1 : -1), spin * 0.12);
        quaternion.setFromEuler(rotation);
        const reveal = 0.6 + arrived * 0.4;
        scale.set(reveal, reveal, reveal);
        matrix.compose(position, quaternion, scale);
        keycaps!.setMatrixAt(index, matrix);
        topOffset
          .set(0, KEYCAP_LEGEND_Y * reveal, 0)
          .applyQuaternion(quaternion)
          .add(position);
        labelQuaternion.copy(quaternion).multiply(labelRotation);
        scale.set(
          planeSizes[index * 2] * reveal,
          planeSizes[index * 2 + 1] * reveal,
          1,
        );
        matrix.compose(topOffset, labelQuaternion, scale);
        legends!.setMatrixAt(index, matrix);
        const waveDistance = Math.abs(
          index - assetFraction * (KEYBOARD_KEYS.length - 1),
        );
        const loadingWave =
          assetFraction > 0 && assetFraction < 1
            ? Math.max(0, 1 - waveDistance / 1.5) * 0.25
            : 0;
        glowData[index] = keyState.glow + loadingWave;
      });
      keycaps!.instanceMatrix.needsUpdate = true;
      legends!.instanceMatrix.needsUpdate = true;
      glowAttribute.needsUpdate = true;
      shaderUniforms.uDissolve.value = state.dissolve;
      legendMaterial.uniforms.uOpacity.value = state.labelOpacity;
      caseMaterial.opacity = state.caseOpacity;
      trimMaterial.opacity = state.caseOpacity * 0.65;
      if (groundMaterial) groundMaterial.opacity = state.caseOpacity * 0.24;
      keyboard.position.y = state.drop;
    };

    resize = (nextViewport?: KeyboardSceneViewport) => {
      if (diagnostics.disposed || !renderer) return;
      if (nextViewport && typeof nextViewport.width === "number")
        viewport = nextViewport;
      const width = Math.max(
        1,
        Math.round(
          viewport?.width ||
            element?.clientWidth ||
            element?.parentElement?.clientWidth ||
            eventWindow?.innerWidth ||
            1,
        ),
      );
      const height = Math.max(
        1,
        Math.round(
          viewport?.height ||
            element?.clientHeight ||
            element?.parentElement?.clientHeight ||
            eventWindow?.innerHeight ||
            1,
        ),
      );
      const pixelRatio = Math.min(
        viewport?.pixelRatio || eventWindow?.devicePixelRatio || 1,
        lowPower ? 1 : 1.5,
      );
      if (
        width === renderedWidth &&
        height === renderedHeight &&
        pixelRatio === renderedPixelRatio
      )
        return;
      diagnostics.width = width;
      diagnostics.height = height;
      diagnostics.pixelRatio = pixelRatio;
      // Rewriting an unchanged canvas size clears its back buffer. Resize once,
      // only on an actual CSS-size or device-scale change, without a blank frame.
      renderer.setDrawingBufferSize(width, height, pixelRatio);
      renderedWidth = width;
      renderedHeight = height;
      renderedPixelRatio = pixelRatio;
      frameOpeningKeyboard(camera, width, height);
      bloom?.resize(width, height, diagnostics.pixelRatio);
      notify();
    };
    eventWindow?.addEventListener("resize", windowResized);
    if (element && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => resize());
      observer.observe(element);
    }
    resize();
    pushInstances();
    if (!lowPower) {
      try {
        // Native imports work in both Window and WorkerGlobalScope; Vite's DOM
        // stylesheet/module preload helper cannot execute inside this worker.
        const { createKeyboardBloom } = (await import(
          /* @vite-ignore */ keyboardBloomUrl
        )) as typeof import("./keyboard-bloom");
        requireActivePreparation();
        bloom = createKeyboardBloom(renderer, scene, camera);
        diagnostics.bloom = true;
        bloom.resize(
          diagnostics.width,
          diagnostics.height,
          diagnostics.pixelRatio,
        );
      } catch (cause) {
        if (diagnostics.disposed) throw cause;
        // Direct rendering remains usable when post-processing cannot initialize.
        diagnostics.degraded = true;
      }
    }
    requireActivePreparation();
    timeline = gsap.timeline({
      paused: true,
      onComplete: () => options.onComplete?.(),
    });
    timeline.call(() => options.onProgress?.("assemble"), [], 0);
    keyStates.forEach((keyState, index) => {
      timeline!.to(
        keyState,
        { arrival: 1, duration: 1.6, ease: "power3.out" },
        0.06 + index * 0.008,
      );
    });
    timeline.to(
      state,
      { caseOpacity: 1, duration: 0.7, ease: "power2.out" },
      0.45,
    );
    timeline.to(state, { labelOpacity: 1, duration: 0.5 }, 1.25);
    timeline.to(
      cameraState,
      { x: 1.7, y: 6.1, z: 8.5, duration: 2.0, ease: "sine.inOut" },
      0.4,
    );
    timeline.call(() => options.onProgress?.("type"), [], 2.7);
    [...WORDMARK].forEach((letter, index) => {
      const keyIndex = KEYBOARD_KEYS.findIndex(
        (key) => key.id === `Key${letter.toUpperCase()}`,
      );
      const at = 2.7 + index * 0.09;
      timeline!.to(
        keyStates[keyIndex],
        { press: 1, glow: 0.65, duration: 0.055, ease: "power2.out" },
        at,
      );
      timeline!.to(
        keyStates[keyIndex],
        { press: 0, glow: 0, duration: 0.15, ease: "back.out(1.4)" },
        at + 0.055,
      );
      timeline!.call(() => options.onKey?.(letter), [], at);
      if (letter !== letter.toLowerCase()) {
        const shift =
          keyStates[KEYBOARD_KEYS.findIndex((key) => key.id === "ShiftLeft")];
        timeline!.to(
          shift,
          { press: 0.8, glow: 0.5, duration: 0.05 },
          at - 0.02,
        );
        timeline!.to(shift, { press: 0, glow: 0, duration: 0.12 }, at + 0.06);
      }
    });
    timeline.call(() => options.onProgress?.("dissolve"), [], 3.7);
    timeline.to(
      state,
      {
        dissolve: 1.001,
        labelOpacity: 0,
        caseOpacity: 0,
        drop: -0.15,
        duration: 0.5,
        ease: "power2.inOut",
      },
      3.7,
    );
    timeline.to(
      cameraState,
      { x: 1.9, y: 6.8, z: 9.5, duration: 0.5, ease: "sine.inOut" },
      3.7,
    );

    renderFrame = (timestamp) => {
      if (diagnostics.disposed || diagnostics.contextLost || !renderer) return;
      try {
        const now = Number.isFinite(timestamp) ? timestamp : performance.now();
        if (playing) {
          state.seconds = clamp((performance.now() - startedAt) / 1000, 0, 4.2);
          timeline!.totalTime(state.seconds, false);
        }
        if (diagnostics.disposed) return;
        const aspectFit = Math.max(1, 1.1 / camera.aspect);
        camera.position.set(
          cameraState.x * aspectFit,
          cameraState.y * aspectFit,
          cameraState.z * aspectFit,
        );
        const radians = Math.PI / 180;
        const yawTarget = finePointer
          ? pointer.x * 4 * radians
          : Math.sin(state.seconds * 0.55) * 2 * radians;
        const pitchTarget = finePointer
          ? pointer.y * 4 * radians
          : Math.sin(state.seconds * 0.4 + 0.6) * 2 * radians;
        cameraParallax.yaw += (yawTarget - cameraParallax.yaw) * 0.06;
        cameraParallax.pitch += (pitchTarget - cameraParallax.pitch) * 0.06;
        // Converge back to the existing exit path rather than shifting its endpoint.
        const orbitAmount = 1 - clamp((state.seconds - 3.7) / 0.5);
        cameraOrbit.set(
          cameraParallax.pitch * orbitAmount,
          cameraParallax.yaw * orbitAmount,
          0,
          "YXZ",
        );
        camera.position.applyEuler(cameraOrbit);
        camera.lookAt(0, 0.02, 0);
        diagnostics.cameraElevationDegrees =
          Math.round(
            (Math.atan2(
              camera.position.y - 0.02,
              Math.hypot(camera.position.x, camera.position.z),
            ) *
              1800) /
              Math.PI,
          ) / 10;
        pushInstances();
        renderer.info.reset();
        if (bloom) bloom.render(state.seconds);
        else renderer.render(scene, camera);
        diagnostics.frames++;
        diagnostics.drawCalls = renderer.info.render.calls;
        if (lastFrameAt && diagnostics.frames > 3) {
          sampleDuration += now - lastFrameAt;
          sampleFrames++;
          if (sampleFrames >= 20) {
            diagnostics.averageFps = Math.round(
              (1000 * sampleFrames) / Math.max(sampleDuration, 1),
            );
            sampleDuration = 0;
            sampleFrames = 0;
            // Report real pacing without changing the user's visual quality.
            // GPU preparation belongs in the worker; slow frames do not remove FX.
            notify();
          }
        }
        lastFrameAt = now;
        if (restorePending) {
          restorePending = false;
          notify();
          options.onRestored?.();
        }
      } catch {
        renderFailed = true;
        renderer.setAnimationLoop(null);
        options.onFailure();
      }
    };
    if (lowPower) {
      // Rendering a new material would synchronously wait for GPU shader linking.
      // compileAsync polls KHR_parallel_shader_compile between browser tasks, so
      // the CSS fallback, input-to-skip handler and absolute intro deadline remain live.
      const preparationStarted = performance.now();
      diagnostics.asyncShaderCompile = true;
      notify();
      await renderer.compileAsync(scene, camera);
      requireActivePreparation();
      diagnostics.shaderPreparationMs = Math.round(
        performance.now() - preparationStarted,
      );
    }
    requireActivePreparation();
    renderFrame(performance.now());
    if (renderFailed) throw new Error("Opening frame could not be rendered");
    requireActivePreparation();
    preparing = false;
    renderer.setAnimationLoop(renderFrame);
    notify();
    return {
      setProgress(progress) {
        assetFraction = Number.isFinite(progress) ? clamp(progress) : 0;
      },
      start(elapsedMs = 0) {
        if (diagnostics.disposed) return;
        startedAt = performance.now() - Math.max(0, elapsedMs);
        timeline!.totalTime(clamp(elapsedMs / 1000, 0, 4.2), true);
        playing = true;
        options.onProgress?.(
          elapsedMs >= 3700
            ? "dissolve"
            : elapsedMs >= 2700
              ? "type"
              : "assemble",
        );
      },
      resize,
      setPointer(x, y) {
        pointer.x = clamp(x, -1, 1);
        pointer.y = clamp(y, -1, 1);
      },
      dispose,
      getDiagnostics: snapshot,
    };
  } catch (cause) {
    dispose();
    if (!options.signal?.aborted) options.onFailure();
    throw cause;
  }
}
