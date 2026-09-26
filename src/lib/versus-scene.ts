import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Points,
  PointsMaterial, Scene, SRGBColorSpace, TextureLoader, WebGLRenderer,
} from "three";
import type { Texture } from "three";
import portraitFraming from "../data/king-portrait-framing.json";
import { getAssetUrl } from "./assets";
import { sampleIntro } from "./versus-timeline";

export type VersusSceneStatus = "loading" | "ready" | "playing" | "holding" | "fallback";
type Frame = ReturnType<typeof sampleIntro>;
type Options = {
  host: HTMLElement;
  effectsHost: HTMLElement;
  slugs: [string, string];
  onFrame: (frame: Frame) => void;
  onStatus: (status: VersusSceneStatus) => void;
};

const framing = portraitFraming as Record<string, { viewBox: string }>;

export function createVersusScene({ host, effectsHost, slugs, onFrame, onStatus }: Options) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  // Foreground trails sit above the DOM plates; WebGL embers sit behind them.
  const effectsCanvas = document.createElement("canvas");
  const effects = effectsCanvas.getContext("2d")!;
  effectsHost.append(effectsCanvas);
  let effectScale = 1;
  let effectsCleared = true;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.z = 10;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const textures = new Set<Texture>();
  let disposed = false;
  let ready = false;
  let frameId = 0;
  let width = 1;
  let height = 1;
  let startedAt: number | null = null;
  let lastRender = 0;

  const portraits = slugs.map((slug) => {
    const crop = (framing[slug]?.viewBox ?? "0 0 1280 742").split(" ").map(Number);
    const geometry = new PlaneGeometry(crop[2] / crop[3], 1);
    const material = new MeshBasicMaterial({ transparent: true, depthWrite: false });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return { crop, mesh, geometry, material };
  });

  // A tiny procedural sprite avoids a separate network request for each spark.
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = spriteCanvas.height = 32;
  const context = spriteCanvas.getContext("2d")!;
  const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, "white");
  glow.addColorStop(0.2, "rgba(255,255,255,.9)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 32, 32);
  const sprite = new CanvasTexture(spriteCanvas);
  textures.add(sprite);

  const count = 280;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = Array.from({ length: count }, (_, index) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.9;
    const color = new Color(index % 3 === 0 ? "#e94016" : "#ffe3a0");
    color.toArray(colors, index * 3);
    return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed * 0.75, life: 0.65 + Math.random() * 1.3, size: 0.6 + Math.random() * 2.1 };
  });
  const sparkGeometry = new BufferGeometry();
  sparkGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  sparkGeometry.setAttribute("color", new BufferAttribute(colors, 3));
  const sparkMaterial = new PointsMaterial({
    map: sprite, size: 7, sizeAttenuation: false, vertexColors: true,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  });
  const sparks = new Points(sparkGeometry, sparkMaterial);
  sparks.frustumCulled = false;
  sparks.visible = false;
  scene.add(sparks);

  function drawEffects(frame: Frame) {
    if (frame.burst < 0 || motion.matches) {
      if (!effectsCleared) effects.clearRect(0, 0, width, height);
      effectsCleared = true;
      return;
    }
    effectsCleared = false;
    effects.clearRect(0, 0, width, height);
    const time = frame.burst;
    const centerX = width / 2;
    const centerY = height * (width < 650 ? 0.68 : 0.62);
    effects.globalCompositeOperation = "lighter";
    const hot = Math.max(0, 1 - time / 0.75);
    // Expanding tongues of fire around the impact rather than a flat white flash.
    if (hot > 0) {
      for (let index = 0; index < 18; index++) {
        const velocity = velocities[index];
        const x = centerX + velocity.x * width * time * 0.42;
        const y = centerY + velocity.y * height * time * 0.38 - time * height * 0.06;
        const radius = Math.max(1, (18 + index % 5 * 9 + time * 60) * hot);
        const flame = effects.createRadialGradient(x, y, 0, x, y, radius);
        flame.addColorStop(0, `rgba(255,235,153,${hot * 0.5})`);
        flame.addColorStop(0.25, `rgba(255,128,20,${hot * 0.3})`);
        flame.addColorStop(0.65, `rgba(196,28,3,${hot * 0.15})`);
        flame.addColorStop(1, "rgba(100,0,0,0)");
        effects.fillStyle = flame;
        effects.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    }
    const visibleCount = width < 650 ? 140 : count;
    for (let index = 0; index < visibleCount; index++) {
      const spark = velocities[index];
      const alpha = Math.max(0, 1 - time / spark.life);
      if (alpha === 0) continue;
      const travel = Math.log(1 + time * 5) / 5;
      const previous = Math.log(1 + Math.max(0, time - 0.04) * 5) / 5;
      const x = centerX + spark.x * width * travel * 1.6;
      const y = centerY + spark.y * height * travel * 1.6 + time * time * height * 0.19;
      effects.strokeStyle = index % 4 === 0 ? `rgba(255,67,14,${alpha})` : `rgba(255,216,115,${alpha})`;
      effects.lineWidth = spark.size;
      effects.beginPath();
      effects.moveTo(centerX + spark.x * width * previous * 1.6, centerY + spark.y * height * previous * 1.6 + Math.max(0, time - 0.04) ** 2 * height * 0.19);
      effects.lineTo(x, y);
      effects.stroke();
    }
    effects.globalCompositeOperation = "source-over";
  }

  function draw(now: number) {
    if (disposed || !ready) return;
    const frame = sampleIntro(startedAt === null ? null : (now - startedAt) / 1000, motion.matches);
    const portraitHeight = Math.min(height * 0.93, width * (width < 650 ? 0.95 : 0.65));
    portraits.forEach(({ mesh }, index) => {
      const direction = index === 0 ? -1 : 1;
      const breath = motion.matches ? 0 : Math.sin(now / 2400 + index) * 0.002;
      const scale = portraitHeight * (0.93 + frame.entrance * 0.07 + frame.flash * 0.025 + breath);
      mesh.scale.setScalar(scale);
      mesh.position.set(
        direction * (width * 0.29 + (1 - frame.entrance) * width * 0.36 + frame.shake * 11),
        height * (width < 650 ? 0.1 : 0), 0,
      );
      mesh.material.opacity = frame.entrance;
    });
    sparks.visible = frame.burst >= 0 && !motion.matches;
    if (sparks.visible) {
      const elapsed = frame.burst;
      velocities.forEach((velocity, index) => {
        positions[index * 3] = velocity.x * width * elapsed;
        positions[index * 3 + 1] = -height * (width < 650 ? 0.18 : 0.12) + velocity.y * height * elapsed - elapsed * elapsed * height * 0.15;
        positions[index * 3 + 2] = 2;
      });
      sparkGeometry.attributes.position.needsUpdate = true;
      sparkMaterial.opacity = Math.max(0, 1 - elapsed / 2);
    }
    onFrame(frame);
    renderer.render(scene, camera);
    drawEffects(frame);
    if (startedAt !== null && frame.finished) {
      startedAt = null;
      onStatus("holding");
    }
  }

  function tick(now: number) {
    frameId = 0;
    if (disposed || document.hidden || !ready) return;
    // Idle breathing uses 30fps; the short intro uses the display's frame rate.
    if (startedAt !== null || now - lastRender >= 32) {
      draw(now);
      lastRender = now;
    }
    if (!motion.matches) frameId = requestAnimationFrame(tick);
  }

  function wake() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (disposed || document.hidden || !ready) return;
    draw(performance.now());
    if (!motion.matches) frameId = requestAnimationFrame(tick);
  }

  function resize() {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effectScale = Math.min(window.devicePixelRatio || 1, 1.5);
    effectsCanvas.width = Math.round(width * effectScale);
    effectsCanvas.height = Math.round(height * effectScale);
    effects.setTransform(effectScale, 0, 0, effectScale, 0, 0);
    wake();
  }

  function handleContextLost(event: Event) {
    event.preventDefault();
    dispose();
    onStatus("fallback");
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  motion.addEventListener("change", wake);
  document.addEventListener("visibilitychange", wake);
  renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
  resize();

  const loader = new TextureLoader();
  Promise.all(slugs.map(async (slug, index) => {
    const texture = await loader.loadAsync(getAssetUrl(`/fighters/portraits/${slug}.webp`));
    if (disposed) { texture.dispose(); return; }
    textures.add(texture);
    texture.colorSpace = SRGBColorSpace;
    const { crop, mesh, material } = portraits[index];
    texture.offset.set(crop[0] / 1280, 1 - (crop[1] + crop[3]) / 1280);
    texture.repeat.set(crop[2] / 1280, crop[3] / 1280);
    material.map = texture;
    material.needsUpdate = true;
    mesh.visible = true;
  })).then(() => {
    if (disposed) return;
    ready = true;
    onStatus("ready");
    wake();
  }).catch(() => {
    if (disposed) return;
    dispose();
    onStatus("fallback");
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    motion.removeEventListener("change", wake);
    document.removeEventListener("visibilitychange", wake);
    renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
    portraits.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
    sparkGeometry.dispose();
    sparkMaterial.dispose();
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    effectsCanvas.remove();
  }

  return {
    play() {
      if (disposed || !ready) return;
      startedAt = performance.now();
      onStatus("playing");
      wake();
    },
    finish() {
      if (disposed || !ready) return;
      startedAt = null;
      onStatus("ready");
      wake();
    },
    dispose,
  };
}
