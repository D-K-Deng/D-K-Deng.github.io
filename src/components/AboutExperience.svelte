<script lang="ts">
  import { onMount, tick } from "svelte";
  import * as THREE from "three";

  type SceneGroup = THREE.Group & {
    userData: { fade?: number; lastFade?: number; [key: string]: unknown };
  };

  type RouteLocation = {
    id: string;
    label: string;
    title: string;
    detail: string;
    summary: string;
    lat: number;
    lng: number;
    colors: [string, string];
    labelOffset: [number, number, number];
  };

  type ResearchProject = {
    id: string;
    label: string;
    eyebrow: string;
    title: string;
    summary: string;
    tags: string[];
    href: string;
    cta: string;
    colors: [string, string];
  };

  type DetailSelection =
    | { kind: "place"; item: RouteLocation }
    | { kind: "project"; item: ResearchProject };

  type PaletteStop = {
    at: number;
    color: THREE.Color;
    glow: THREE.Color;
  };

  type ThemeMaterialBinding = {
    material: THREE.Material;
    darkColor?: THREE.Color;
    lightColor?: THREE.Color;
    darkEmissive?: THREE.Color;
    lightEmissive?: THREE.Color;
    darkEmissiveIntensity?: number;
    lightEmissiveIntensity?: number;
  };

  const chapterStops = [0, 0.12, 0.34, 0.56, 0.68, 0.795, 0.9, 1];
  const chapterLabels = [
    "Start",
    "Chengdu",
    "Path",
    "Glitter",
    "EmoPus",
    "Agents",
    "Interest",
    "Next",
  ];
  const routeLocations: RouteLocation[] = [
    {
      id: "chengdu",
      label: "Chengdu",
      title: "Chengdu",
      detail: "Sichuan, China",
      summary:
        "My hometown and starting point—a city where technological momentum, creative culture, and an unhurried rhythm coexist.",
      lat: 30.5728,
      lng: 104.0668,
      colors: ["#E5473A", "#A91F2D"],
      labelOffset: [-0.58, 0.48, 0],
    },
    {
      id: "duke-kunshan",
      label: "Duke Kunshan",
      title: "Duke Kunshan",
      detail: "Kunshan, China",
      summary:
        "At DKU, I studied Computation & Design and Computer Science in an interdisciplinary setting shaped by global perspectives and hands-on making.",
      lat: 31.3856,
      lng: 120.9807,
      colors: ["#006633", "#003399"],
      labelOffset: [0.62, 0.48, 0],
    },
    {
      id: "duke",
      label: "Duke",
      title: "Duke University",
      detail: "Durham, NC, USA",
      summary:
        "Across Duke and DKU, I developed the same two academic threads—Computation & Design and Computer Science—through deeper technical study and cross-campus collaboration.",
      lat: 36.0014,
      lng: -78.9382,
      colors: ["#012169", "#00539B"],
      labelOffset: [0.52, -0.46, 0],
    },
    {
      id: "hkust-gz",
      label: "HKUST(GZ)",
      title: "HKUST(GZ)",
      detail: "Guangzhou, China",
      summary:
        "At HKUST(GZ), I worked in HCI, exploring how intelligent and interactive systems can better support real human practices.",
      lat: 22.901,
      lng: 113.475,
      colors: ["#996600", "#003366"],
      labelOffset: [-0.58, -0.44, 0],
    },
    {
      id: "dartmouth",
      label: "Dartmouth",
      title: "Dartmouth College",
      detail: "Hanover, NH, USA",
      summary:
        "At Dartmouth, I am continuing this path through an M.S. in Computer Science, with a focus on human-centered and agentic AI systems.",
      lat: 43.7044,
      lng: -72.2887,
      colors: ["#00693E", "#004C2C"],
      labelOffset: [-0.08, 0.54, 0],
    },
  ];

  const humanAiProjects: ResearchProject[] = [
    {
      id: "glitter",
      label: "Glitter",
      eyebrow: "PUBLISHED RESEARCH · IJHCI 2026",
      title: "Glitter",
      summary:
        "An LLM-powered virtual agent that combines self-directed ABA learning with conversational support for autism-intervention practitioners. A one-week field study with 11 practitioners examined how it could support inquiry, comparison, preparation, and reflection in real practice.",
      tags: [
        "IJHCI · 2026",
        "LLM Agent",
        "Human–AI Collaboration",
        "Digital Health",
        "Field Study",
      ],
      href: "/posts/glitter/",
      cta: "Read the Glitter story",
      colors: ["#7C8CFF", "#C486FF"],
    },
  ];

  const affectiveProjects: ResearchProject[] = [
    {
      id: "emopus",
      label: "EmoPus",
      eyebrow: "PUBLISHED RESEARCH · UIST ADJUNCT 2024",
      title: "EmoPus",
      summary:
        "An octopus-inspired AI desk companion combining voice emotion recognition, touch sensing, expressive motion, tactile comfort, and simple physical assistance to explore how emotional intelligence can move beyond the screen.",
      tags: [
        "UIST Adjunct · 2024",
        "Affective Computing",
        "Companion Robot",
        "HRI",
        "Tangible Interaction",
      ],
      href: "/posts/octopus/",
      cta: "Meet EmoPus",
      colors: ["#50E0BD", "#62A8FF"],
    },
  ];

  const agentProjects: ResearchProject[] = [
    {
      id: "adaptive-code-agents",
      label: "Adaptive Code AI Agents",
      eyebrow: "AGENT SYSTEM · CODING INTELLIGENCE",
      title: "Adaptive Code AI Agents",
      summary:
        "A coding-agent system combining utility-gated suggestions, a permission-aware ReAct-style CLI assistant, and reward-driven execution and post-training—addressing both when an agent should intervene and how it can learn to help better.",
      tags: [
        "LLM Agents",
        "ReAct",
        "Utility Gating",
        "Reinforcement Learning",
        "Code Generation",
      ],
      href: "/posts/adaptivecodeagents/",
      cta: "Explore the agent system",
      colors: ["#86A8FF", "#9B7CFF"],
    },
    {
      id: "pwngpt-pipeline",
      label: "PwnGPT Pipeline",
      eyebrow: "AGENT SYSTEM · VERIFIED TOOL USE",
      title: "PwnGPT Pipeline",
      summary:
        "An LLM-guided reverse-engineering pipeline that turns exploit development into a controlled loop of static analysis, evidence gathering, generation, verification, reflection, and repair.",
      tags: [
        "LLM Orchestration",
        "Tool Use",
        "Verification",
        "Reflection",
        "Security",
      ],
      href: "/posts/pwngptpipeline/",
      cta: "See the verified pipeline",
      colors: ["#9B7CFF", "#E27DFF"],
    },
  ];
  const chapterTransitionFeather = 0.038;
  const journeyMotionStart = 0.24;
  const journeyMotionEnd = 0.76;
  const playCountBase = 376001;
  const playCountMax = 376400;
  const playCountStorageKey = "about-play-count-v2";

  const makePalette = (
    stops: Array<{ at: number; color: string; glow: string }>,
  ): PaletteStop[] =>
    stops.map((stop) => ({
      at: stop.at,
      color: new THREE.Color(stop.color),
      glow: new THREE.Color(stop.glow),
    }));

  const darkPalette = makePalette([
    { at: 0, color: "#05060a", glow: "#6f8dff" },
    { at: 0.12, color: "#07101b", glow: "#8ec5ff" },
    { at: 0.24, color: "#1c0c08", glow: "#ff8a4c" },
    { at: 0.37, color: "#050b19", glow: "#4a8dff" },
    { at: 0.51, color: "#061513", glow: "#52e0bd" },
    { at: 0.64, color: "#15091d", glow: "#c58cff" },
    { at: 0.78, color: "#070b14", glow: "#82a7ff" },
    { at: 0.9, color: "#160d17", glow: "#ff8ab7" },
    { at: 1, color: "#05060a", glow: "#d8e3ff" },
  ]);

  const lightPalette = makePalette([
    { at: 0, color: "#f4f6fb", glow: "#4f67d6" },
    { at: 0.12, color: "#eef7fc", glow: "#347db6" },
    { at: 0.24, color: "#fff3ea", glow: "#c95f32" },
    { at: 0.37, color: "#eff5ff", glow: "#356bc6" },
    { at: 0.51, color: "#edf8f4", glow: "#168c74" },
    { at: 0.64, color: "#f8f0fb", glow: "#8b55b7" },
    { at: 0.78, color: "#f1f4fc", glow: "#526dc7" },
    { at: 0.9, color: "#fff0f5", glow: "#c84f82" },
    { at: 1, color: "#f4f6fb", glow: "#5b6cb7" },
  ]);

  const darkSceneColor = new THREE.Color();
  const darkSceneGlow = new THREE.Color();
  const lightSceneColor = new THREE.Color();
  const lightSceneGlow = new THREE.Color();
  const blendedSceneColor = new THREE.Color();
  const blendedSceneGlow = new THREE.Color();
  const themedMaterials: ThemeMaterialBinding[] = [];

  let experience: HTMLElement;
  let canvas: HTMLCanvasElement;
  let targetProgress = 0;
  let progress = 0;
  let activeChapter = 0;
  let reducedMotion = false;
  let webglReady = true;
  let sceneReady = false;
  let background = "var(--about-initial-bg)";
  let glow = "var(--about-initial-glow)";
  let themeTarget = 1;
  let themeMix = 1;
  let themeIsDark = true;
  let journeyLocationIndex = 0;
  let displayPlayCount = 0;
  let playCountProgress = 0;
  let playCountStarted = false;
  let selectedDetail: DetailSelection | null = null;
  let detailPanel: HTMLElement | undefined;

  const clamp = (value: number, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const x = clamp((value - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
  };

  const mix = (a: number, b: number, amount: number) =>
    a + (b - a) * amount;

  function chapterBounds(index: number) {
    const center = chapterStops[index];
    const entry = index === 0
      ? -0.08
      : (chapterStops[index - 1] + center) / 2;
    const exit = index === chapterStops.length - 1
      ? 1.08
      : (center + chapterStops[index + 1]) / 2;
    return { center, entry, exit };
  }

  function chapterAlpha(value: number, index: number) {
    if (reducedMotion) return 1;
    const { entry, exit } = chapterBounds(index);
    const enter = index === 0
      ? 1
      : smoothstep(
          entry - chapterTransitionFeather,
          entry + chapterTransitionFeather,
          value,
        );
    const leave = index === chapterStops.length - 1
      ? 1
      : 1 - smoothstep(
          exit - chapterTransitionFeather,
          exit + chapterTransitionFeather,
          value,
        );
    return Math.pow(enter * leave, 1.25);
  }

  function chapterLocalProgress(value: number, index: number) {
    const { entry, exit } = chapterBounds(index);
    return clamp((value - entry) / Math.max(0.001, exit - entry));
  }

  function chapterStyle(value: number, index: number, direction = 1) {
    if (reducedMotion) return "opacity: 1; transform: none; filter: none;";
    const alpha = chapterAlpha(value, index);
    const { center } = chapterBounds(index);
    const entering = value <= center;
    const translateY = (entering ? 46 : -34) * (1 - alpha);
    const translateX = -direction * 64 * (1 - alpha);
    const scale = 0.97 + alpha * 0.03;
    const blur = (1 - alpha) * 0.8;
    return `opacity:${alpha}; transform:translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}); filter:blur(${blur}px);`;
  }

  function interpolatePalette(
    palette: PaletteStop[],
    value: number,
    colorTarget: THREE.Color,
    glowTarget: THREE.Color,
  ) {
    const rightIndex = palette.findIndex((item) => item.at >= value);
    if (rightIndex <= 0) {
      colorTarget.copy(palette[0].color);
      glowTarget.copy(palette[0].glow);
      return;
    }
    const right = palette[rightIndex];
    const left = palette[rightIndex - 1];
    const amount = smoothstep(left.at, right.at, value);
    colorTarget.copy(left.color).lerp(right.color, amount);
    glowTarget.copy(left.glow).lerp(right.glow, amount);
  }

  function scrollToChapter(index: number) {
    if (!experience) return;
    const scrollable = experience.offsetHeight - window.innerHeight;
    const top = experience.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + chapterStops[index] * scrollable,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function journeyTravelProgress(value: number) {
    const localProgress = chapterLocalProgress(value, 2);
    return clamp(
      (localProgress - journeyMotionStart) /
        Math.max(0.001, journeyMotionEnd - journeyMotionStart),
    );
  }

  function journeyLocationTarget(index: number) {
    const { entry, exit } = chapterBounds(2);
    const normalized = index / Math.max(1, routeLocations.length - 1);
    const localTarget = mix(journeyMotionStart, journeyMotionEnd, normalized);
    return mix(entry, exit, localTarget);
  }

  function scrollToJourneyLocation(index: number) {
    if (!experience) return;
    const target = journeyLocationTarget(index);
    const scrollable = experience.offsetHeight - window.innerHeight;
    const top = experience.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + target * scrollable,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  async function openPlaceDetail(index: number) {
    selectedDetail = { kind: "place", item: routeLocations[index] };
    scrollToJourneyLocation(index);
    await tick();
    detailPanel?.focus();
  }

  async function openProjectDetail(project: ResearchProject) {
    selectedDetail = { kind: "project", item: project };
    await tick();
    detailPanel?.focus();
  }

  function closeDetail() {
    selectedDetail = null;
  }

  function markMaterial(
    material: THREE.Material,
    opacity = 1,
    depthWrite = opacity >= 1,
  ) {
    material.transparent = true;
    material.opacity = opacity;
    material.depthWrite = depthWrite;
    material.userData.baseOpacity = opacity;
    return material;
  }

  function registerThemeMaterial<T extends THREE.Material>(
    material: T,
    values: {
      darkColor?: string;
      lightColor?: string;
      darkEmissive?: string;
      lightEmissive?: string;
      darkEmissiveIntensity?: number;
      lightEmissiveIntensity?: number;
    },
  ): T {
    themedMaterials.push({
      material,
      darkColor: values.darkColor
        ? new THREE.Color(values.darkColor)
        : undefined,
      lightColor: values.lightColor
        ? new THREE.Color(values.lightColor)
        : undefined,
      darkEmissive: values.darkEmissive
        ? new THREE.Color(values.darkEmissive)
        : undefined,
      lightEmissive: values.lightEmissive
        ? new THREE.Color(values.lightEmissive)
        : undefined,
      darkEmissiveIntensity: values.darkEmissiveIntensity,
      lightEmissiveIntensity: values.lightEmissiveIntensity,
    });
    return material;
  }

  function applyMaterialTheme(amount: number) {
    for (const binding of themedMaterials) {
      const material = binding.material as THREE.Material & {
        color?: THREE.Color;
        emissive?: THREE.Color;
        emissiveIntensity?: number;
      };
      if (material.color && binding.lightColor && binding.darkColor) {
        material.color.copy(binding.lightColor).lerp(binding.darkColor, amount);
      }
      if (material.emissive && binding.lightEmissive && binding.darkEmissive) {
        material.emissive
          .copy(binding.lightEmissive)
          .lerp(binding.darkEmissive, amount);
      }
      if (
        typeof material.emissiveIntensity === "number" &&
        typeof binding.lightEmissiveIntensity === "number" &&
        typeof binding.darkEmissiveIntensity === "number"
      ) {
        material.emissiveIntensity = mix(
          binding.lightEmissiveIntensity,
          binding.darkEmissiveIntensity,
          amount,
        );
      }
    }
  }

  function fadeGroup(group: SceneGroup, amount: number) {
    const opacity = clamp(amount);
    group.visible = opacity > 0.002;
    group.userData.fade = opacity;
    const lastFade = group.userData.lastFade;
    if (typeof lastFade === "number" && Math.abs(lastFade - opacity) < 0.001) {
      return;
    }
    group.userData.lastFade = opacity;
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        const baseOpacity = material.userData.baseOpacity ?? material.opacity ?? 1;
        material.userData.baseOpacity = baseOpacity;
        material.transparent = true;
        material.opacity = baseOpacity * opacity;
        material.depthWrite = false;
      }
    });
  }

  function makeGlowTexture() {
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const context = glowCanvas.getContext("2d");
    if (!context) return null;
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,.95)");
    gradient.addColorStop(0.18, "rgba(159,191,255,.55)");
    gradient.addColorStop(0.55, "rgba(92,118,255,.16)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(glowCanvas);
  }

  function makeStars(count: number) {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const radius = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 5;
      sizes[i] = 0.5 + Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    const material = registerThemeMaterial(
      markMaterial(
        new THREE.PointsMaterial({
          color: 0xdde8ff,
          size: 0.035,
          transparent: true,
          opacity: 0.55,
          sizeAttenuation: true,
        }),
        0.55,
        false,
      ),
      { darkColor: "#dde8ff", lightColor: "#647499" },
    );
    return new THREE.Points(geometry, material);
  }

  function makeCore(glowTexture: THREE.Texture | null) {
    const group = new THREE.Group() as SceneGroup;
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.16, 5),
      registerThemeMaterial(
        markMaterial(
          new THREE.MeshPhysicalMaterial({
            color: 0xdde7ff,
            emissive: 0x17254d,
            emissiveIntensity: 0.55,
            roughness: 0.12,
            metalness: 0.18,
            transmission: 0.32,
            thickness: 1.1,
            clearcoat: 1,
            clearcoatRoughness: 0.16,
            transparent: true,
            opacity: 0.72,
          }),
          0.72,
          false,
        ),
        {
          darkColor: "#dde7ff",
          lightColor: "#b6c1e6",
          darkEmissive: "#17254d",
          lightEmissive: "#dbe2f5",
          darkEmissiveIntensity: 0.55,
          lightEmissiveIntensity: 0.22,
        },
      ),
    );
    shell.name = "core-shell";
    group.add(shell);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.3, 2),
      registerThemeMaterial(
        markMaterial(
          new THREE.MeshBasicMaterial({
            color: 0xa9c4ff,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
          }),
          0.2,
          false,
        ),
        { darkColor: "#a9c4ff", lightColor: "#788cc8" },
      ),
    );
    wire.name = "core-wire";
    group.add(wire);

    [1.75, 2.15, 2.55].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012 + index * 0.004, 8, 180),
        registerThemeMaterial(
          markMaterial(
            new THREE.MeshBasicMaterial({
              color: index === 1 ? 0xffffff : 0x8aa8ff,
              transparent: true,
              opacity: 0.25 - index * 0.045,
            }),
            0.25 - index * 0.045,
            false,
          ),
          {
            darkColor: index === 1 ? "#ffffff" : "#8aa8ff",
            lightColor: index === 1 ? "#8291bc" : "#8193cb",
          },
        ),
      );
      ring.name = `core-ring-${index}`;
      ring.rotation.set(index * 0.72, index * 0.47, index * 0.9);
      group.add(ring);
    });

    if (glowTexture) {
      const sprite = new THREE.Sprite(
        registerThemeMaterial(
          markMaterial(
            new THREE.SpriteMaterial({
              map: glowTexture,
              color: 0x8daaff,
              transparent: true,
              opacity: 0.42,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
            0.42,
            false,
          ),
          { darkColor: "#8daaff", lightColor: "#a2b0dc" },
        ),
      );
      sprite.scale.setScalar(5.5);
      sprite.name = "core-glow";
      group.add(sprite);
    }
    return group;
  }

  function makeChengdu() {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(2.65, -1.15, 0);

    const groundMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x27100c,
          emissive: 0x180704,
          roughness: 0.9,
          transparent: true,
          opacity: 0.72,
        }),
        0.72,
        false,
      ),
      {
        darkColor: "#27100c",
        lightColor: "#d7a58f",
        darkEmissive: "#180704",
        lightEmissive: "#9b5f49",
        darkEmissiveIntensity: 1,
        lightEmissiveIntensity: 0.3,
      },
    );
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 5.4, 0.18, 64),
      groundMaterial,
    );
    ground.scale.z = 0.72;
    group.add(ground);

    const mountainMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x3a1712,
          emissive: 0x1c0806,
          roughness: 1,
          transparent: true,
          opacity: 0.8,
        }),
        0.8,
        false,
      ),
      {
        darkColor: "#3a1712",
        lightColor: "#cda393",
        darkEmissive: "#1c0806",
        lightEmissive: "#8b6255",
        darkEmissiveIntensity: 1,
        lightEmissiveIntensity: 0.24,
      },
    );
    for (let i = 0; i < 8; i += 1) {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(0.85 + Math.random() * 0.9, 1.3 + Math.random(), 5),
        mountainMaterial,
      );
      markMaterial(mountain.material as THREE.Material, 0.8, false);
      mountain.position.set(-3.9 + i * 1.05, 0.45, -2.1 - Math.random() * 0.8);
      mountain.rotation.y = Math.random();
      mountain.scale.z = 0.65;
      group.add(mountain);
    }

    const buildingMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x42201a,
          emissive: 0x1d0907,
          roughness: 0.72,
          transparent: true,
          opacity: 0.9,
        }),
        0.9,
        false,
      ),
      {
        darkColor: "#42201a",
        lightColor: "#c88772",
        darkEmissive: "#1d0907",
        lightEmissive: "#825043",
        darkEmissiveIntensity: 1,
        lightEmissiveIntensity: 0.28,
      },
    );
    const windowMaterial = markMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xffb16f,
        transparent: true,
        opacity: 0.76,
      }),
      0.76,
      false,
    );
    for (let i = 0; i < 30; i += 1) {
      const width = 0.18 + Math.random() * 0.32;
      const height = 0.35 + Math.random() * 1.45;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, width),
        buildingMaterial,
      );
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 3.1;
      building.position.set(
        Math.cos(angle) * radius,
        height / 2 + 0.1,
        Math.sin(angle) * radius * 0.52,
      );
      group.add(building);
      if (i % 3 === 0) {
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(width * 0.38, Math.min(0.16, height * 0.2)),
          windowMaterial,
        );
        window.position.copy(building.position);
        window.position.z += width / 2 + 0.004;
        group.add(window);
      }
    }

    const pagoda = new THREE.Group();
    const pagodaRed = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x9e2c20,
          emissive: 0x36100b,
          metalness: 0.08,
          roughness: 0.62,
          transparent: true,
        }),
        1,
        false,
      ),
      {
        darkColor: "#9e2c20",
        lightColor: "#dc6e5b",
        darkEmissive: "#36100b",
        lightEmissive: "#963f31",
        darkEmissiveIntensity: 1,
        lightEmissiveIntensity: 0.34,
      },
    );
    const roofMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x131313,
          emissive: 0x090909,
          metalness: 0.18,
          roughness: 0.42,
          transparent: true,
        }),
        1,
        false,
      ),
      {
        darkColor: "#131313",
        lightColor: "#66565a",
        darkEmissive: "#090909",
        lightEmissive: "#413438",
        darkEmissiveIntensity: 0.5,
        lightEmissiveIntensity: 0.24,
      },
    );
    for (let level = 0; level < 4; level += 1) {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24 - level * 0.025, 0.28 - level * 0.025, 0.42, 6),
        pagodaRed,
      );
      base.position.y = 0.22 + level * 0.43;
      pagoda.add(base);
      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.08,
          0.48 - level * 0.05,
          0.13,
          6,
        ),
        roofMaterial,
      );
      roof.position.y = 0.46 + level * 0.43;
      pagoda.add(roof);
    }
    pagoda.position.set(1.2, 0.12, 0.35);
    pagoda.scale.setScalar(1.15);
    group.add(pagoda);

    const bamboo = new THREE.Group();
    const bambooMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x4f6b35,
          emissive: 0x15200d,
          roughness: 0.82,
          transparent: true,
        }),
        1,
        false,
      ),
      {
        darkColor: "#4f6b35",
        lightColor: "#5f9a72",
        darkEmissive: "#15200d",
        lightEmissive: "#315f43",
        darkEmissiveIntensity: 1,
        lightEmissiveIntensity: 0.3,
      },
    );
    for (let i = 0; i < 6; i += 1) {
      const height = 1.35 + Math.random() * 1.35;
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.035, height, 8),
        bambooMaterial,
      );
      stalk.position.set(i * 0.16, height / 2, Math.sin(i) * 0.13);
      stalk.rotation.z = (i - 2) * 0.018;
      bamboo.add(stalk);
      for (let j = 0; j < 3; j += 1) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 8, 5),
          bambooMaterial,
        );
        leaf.scale.set(1.8, 0.23, 0.7);
        leaf.position.set(
          stalk.position.x + (j % 2 ? 0.16 : -0.14),
          height * (0.64 + j * 0.11),
          stalk.position.z,
        );
        leaf.rotation.z = j % 2 ? -0.5 : 0.5;
        bamboo.add(leaf);
      }
    }
    bamboo.position.set(-2.8, 0.08, 0.45);
    group.add(bamboo);

    return group;
  }

  function latLngToVector(lat: number, lng: number, radius: number) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }

  function paintJourneyLabel(
    labelCanvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    title: string,
    detail: string,
    colors: [string, string],
    isDark: boolean,
  ) {
    context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    context.beginPath();
    context.moveTo(24, 8);
    context.lineTo(488, 8);
    context.quadraticCurveTo(504, 8, 504, 24);
    context.lineTo(504, 120);
    context.quadraticCurveTo(504, 136, 488, 136);
    context.lineTo(24, 136);
    context.quadraticCurveTo(8, 136, 8, 120);
    context.lineTo(8, 24);
    context.quadraticCurveTo(8, 8, 24, 8);
    context.closePath();
    context.fillStyle = isDark
      ? "rgba(7, 12, 24, 0.78)"
      : "rgba(250, 252, 255, 0.92)";
    context.shadowColor = isDark
      ? "rgba(0, 0, 0, 0.24)"
      : "rgba(46, 59, 88, 0.16)";
    context.shadowBlur = isDark ? 12 : 18;
    context.shadowOffsetY = isDark ? 3 : 6;
    context.fill();
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.strokeStyle = colors[1];
    context.globalAlpha = isDark ? 0.62 : 0.48;
    context.lineWidth = 2;
    context.stroke();
    context.globalAlpha = 1;

    context.beginPath();
    context.arc(42, 54, 7, 0, Math.PI * 2);
    context.fillStyle = colors[0];
    context.fill();
    context.shadowColor = colors[1];
    context.shadowBlur = 16;
    context.fill();
    context.shadowBlur = 0;

    context.fillStyle = isDark
      ? "rgba(255, 255, 255, 0.96)"
      : "rgba(23, 32, 51, 0.96)";
    context.font = "650 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.fillText(title, 68, 63);
    context.fillStyle = isDark
      ? "rgba(225, 233, 249, 0.65)"
      : "rgba(32, 43, 64, 0.62)";
    context.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.fillText(detail, 68, 101);
  }

  function makeJourneyLabel(
    title: string,
    detail: string,
    colors: [string, string],
  ) {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 144;
    const context = labelCanvas.getContext("2d");
    if (!context) return null;
    paintJourneyLabel(
      labelCanvas,
      context,
      title,
      detail,
      colors,
      themeIsDark,
    );

    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const material = markMaterial(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.78,
        depthTest: false,
        depthWrite: false,
      }),
      0.78,
      false,
    );
    const label = new THREE.Sprite(material);
    label.scale.set(1.78, 0.5, 1);
    label.userData.baseScale = 1;
    label.userData.journeyLabel = {
      canvas: labelCanvas,
      context,
      title,
      detail,
      colors,
      texture,
    };
    return label;
  }

  function updateJourneyLabelTheme(group: SceneGroup, isDark: boolean) {
    group.traverse((object) => {
      const data = object.userData.journeyLabel as
        | {
            canvas: HTMLCanvasElement;
            context: CanvasRenderingContext2D;
            title: string;
            detail: string;
            colors: [string, string];
            texture: THREE.CanvasTexture;
          }
        | undefined;
      if (!data) return;
      paintJourneyLabel(
        data.canvas,
        data.context,
        data.title,
        data.detail,
        data.colors,
        isDark,
      );
      data.texture.needsUpdate = true;
    });
  }

  function makeJourney(glowTexture: THREE.Texture | null) {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(-2.65, -0.2, 0);
    const assembly = new THREE.Group();
    assembly.name = "journey-assembly";
    group.add(assembly);

    const globeMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x8fb5ff,
          wireframe: true,
          transparent: true,
          opacity: 0.14,
        }),
        0.14,
        false,
      ),
      { darkColor: "#8fb5ff", lightColor: "#4465b4" },
    );
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 36, 24),
      globeMaterial,
    );
    globe.name = "journey-globe";
    assembly.add(globe);

    const routeMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.LineBasicMaterial({
          color: 0x6489d8,
          transparent: true,
          opacity: 0.2,
        }),
        0.2,
        false,
      ),
      { darkColor: "#6489d8", lightColor: "#4f669d" },
    );

    const vectors = routeLocations.map((location) =>
      latLngToVector(location.lat, location.lng, 2.27),
    );
    const curves: THREE.QuadraticBezierCurve3[] = [];
    const trailPoints: THREE.Vector3[] = [];
    vectors.forEach((vector, index) => {
      const location = routeLocations[index];
      const pointMaterial = markMaterial(
        new THREE.MeshBasicMaterial({
          color: location.colors[0],
          transparent: true,
          opacity: 0.95,
        }),
        0.95,
        false,
      );
      const point = new THREE.Mesh(
        new THREE.SphereGeometry(index === vectors.length - 1 ? 0.075 : 0.055, 16, 16),
        pointMaterial,
      );
      point.position.copy(vector);
      point.name = `journey-point-${index}`;
      assembly.add(point);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.09, 0.13, 28),
        markMaterial(
          new THREE.MeshBasicMaterial({
            color: location.colors[1],
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
          }),
          0.42,
          false,
        ),
      );
      ring.position.copy(vector.clone().multiplyScalar(1.003));
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        vector.clone().normalize(),
      );
      ring.name = `journey-ring-${index}`;
      assembly.add(ring);

      const label = makeJourneyLabel(
        location.title,
        location.detail,
        location.colors,
      );
      if (label) {
        const labelOffset = new THREE.Vector3(...location.labelOffset);
        label.position
          .copy(vector.clone().multiplyScalar(1.11))
          .add(labelOffset);
        label.name = `journey-label-${index}`;
        assembly.add(label);
      }

      if (index < vectors.length - 1) {
        const start = vector;
        const end = vectors[index + 1];
        const midpoint = start
          .clone()
          .add(end)
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(2.7 + index * 0.12);
        const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
        curves.push(curve);
        const curvePoints = curve.getPoints(64);
        trailPoints.push(...(index === 0 ? curvePoints : curvePoints.slice(1)));
        const route = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curvePoints),
          routeMaterial,
        );
        route.name = `journey-route-${index}`;
        route.userData.curve = curve;
        assembly.add(route);
      }
    });

    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    trailGeometry.setDrawRange(0, 1);
    const trail = new THREE.Line(
      trailGeometry,
      registerThemeMaterial(
        markMaterial(
          new THREE.LineBasicMaterial({
            color: 0x9fc0ff,
            transparent: true,
            opacity: 0.95,
          }),
          0.95,
          false,
        ),
        { darkColor: "#9fc0ff", lightColor: "#355bb1" },
      ),
    );
    trail.name = "journey-trail";
    trail.userData.totalPoints = trailPoints.length;
    assembly.add(trail);

    const traveler = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 16),
      registerThemeMaterial(
        markMaterial(
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
          1,
          false,
        ),
        { darkColor: "#ffffff", lightColor: "#213c82" },
      ),
    );
    traveler.position.copy(vectors[0]);
    traveler.name = "journey-traveler";
    if (glowTexture) {
      const travelerGlow = new THREE.Sprite(
          registerThemeMaterial(
            markMaterial(
              new THREE.SpriteMaterial({
                map: glowTexture,
                color: 0x8fb1ff,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: false,
              }),
              0.8,
              false,
            ),
            { darkColor: "#8fb1ff", lightColor: "#355bb1" },
          ),
      );
      travelerGlow.scale.setScalar(0.72);
      traveler.add(travelerGlow);
    }
    assembly.add(traveler);

    assembly.userData.vectors = vectors;
    assembly.userData.curves = curves;

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.95, 0.012, 8, 180),
      registerThemeMaterial(
        markMaterial(
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.14,
          }),
          0.14,
          false,
        ),
        { darkColor: "#ffffff", lightColor: "#5a6c93" },
      ),
    );
    orbit.name = "journey-orbit";
    orbit.rotation.set(1.16, 0.2, -0.34);
    assembly.add(orbit);
    return group;
  }

  function makeNetwork() {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(2.55, 0, 0);
    const nodeMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshPhysicalMaterial({
          color: 0xb8fff0,
          emissive: 0x0f6958,
          emissiveIntensity: 0.75,
          roughness: 0.22,
          metalness: 0.08,
          transparent: true,
        }),
        0.95,
        false,
      ),
      {
        darkColor: "#b8fff0",
        lightColor: "#82d9c8",
        darkEmissive: "#0f6958",
        lightEmissive: "#3b9c89",
        darkEmissiveIntensity: 0.75,
        lightEmissiveIntensity: 0.42,
      },
    );
    const center = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.72, 2),
      nodeMaterial,
    );
    center.name = "network-center";
    group.add(center);

    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2;
      const ring = i % 3;
      const radius = 1.45 + ring * 0.52;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.3) * (0.8 + ring * 0.22),
        Math.sin(angle) * radius * 0.55,
      );
      nodePositions.push(position);
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + (i % 4) * 0.012, 12, 12),
        nodeMaterial,
      );
      node.position.copy(position);
      node.name = `network-node-${i}`;
      group.add(node);
    }

    const lineMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.LineBasicMaterial({
          color: 0x7ce3d0,
          transparent: true,
          opacity: 0.24,
        }),
        0.24,
        false,
      ),
      { darkColor: "#7ce3d0", lightColor: "#168a75" },
    );
    nodePositions.forEach((position, index) => {
      const points = [
        index % 2 ? new THREE.Vector3() : nodePositions[(index + 5) % nodePositions.length],
        position,
      ];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        lineMaterial,
      );
      group.add(line);
    });

    const panelMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshPhysicalMaterial({
          color: 0xa4d8ff,
          emissive: 0x0a2538,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          transmission: 0.58,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
        0.18,
        false,
      ),
      {
        darkColor: "#a4d8ff",
        lightColor: "#9ac6e1",
        darkEmissive: "#0a2538",
        lightEmissive: "#4f83a4",
        darkEmissiveIntensity: 0.3,
        lightEmissiveIntensity: 0.24,
      },
    );
    for (let i = 0; i < 6; i += 1) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9 + (i % 2) * 0.32, 0.48),
        panelMaterial,
      );
      const angle = (i / 6) * Math.PI * 2;
      panel.position.set(
        Math.cos(angle) * 2.7,
        Math.sin(angle * 1.5) * 1.2,
        Math.sin(angle) * 1.4,
      );
      panel.lookAt(0, 0, 4);
      panel.name = `network-panel-${i}`;
      group.add(panel);
    }
    return group;
  }

  function makeOctopus() {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(-2.55, -0.35, 0);
    const skinMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshPhysicalMaterial({
          color: 0xb26cff,
          emissive: 0x31114a,
          emissiveIntensity: 0.52,
          roughness: 0.32,
          metalness: 0.04,
          clearcoat: 0.86,
          clearcoatRoughness: 0.22,
          transparent: true,
        }),
        0.96,
        false,
      ),
      {
        darkColor: "#b26cff",
        lightColor: "#b483de",
        darkEmissive: "#31114a",
        lightEmissive: "#7545a1",
        darkEmissiveIntensity: 0.52,
        lightEmissiveIntensity: 0.38,
      },
    );
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 48, 32),
      skinMaterial,
    );
    head.scale.set(1, 0.92, 0.88);
    head.position.y = 0.75;
    head.name = "octopus-head";
    group.add(head);

    const eyeWhite = markMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xf8f7ff,
        transparent: true,
      }),
      1,
      false,
    );
    const eyeBlack = markMaterial(
      new THREE.MeshBasicMaterial({ color: 0x101018, transparent: true }),
      1,
      false,
    );
    [-0.34, 0.34].forEach((x) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 20, 16),
        eyeWhite,
      );
      eye.position.set(x, 0.84, 0.76);
      group.add(eye);
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.072, 16, 12),
        eyeBlack,
      );
      pupil.position.set(x, 0.84, 0.9);
      group.add(pupil);
    });

    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const points = [
        new THREE.Vector3(outward.x * 0.48, 0.2, outward.z * 0.44),
        new THREE.Vector3(outward.x * 0.95, -0.05, outward.z * 0.78),
        new THREE.Vector3(outward.x * 1.48, -0.28 + (i % 2) * 0.18, outward.z * 1.18),
        new THREE.Vector3(
          outward.x * 2.0 + Math.sin(i * 1.8) * 0.28,
          -0.18 + Math.cos(i) * 0.18,
          outward.z * 1.65,
        ),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const tentacle = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 42, 0.105, 10, false),
        skinMaterial,
      );
      tentacle.name = `tentacle-${i}`;
      group.add(tentacle);
    }

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.018, 8, 180),
        registerThemeMaterial(
          markMaterial(
            new THREE.MeshBasicMaterial({
              color: 0xd5b2ff,
              transparent: true,
              opacity: 0.2,
            }),
            0.2,
            false,
          ),
          { darkColor: "#d5b2ff", lightColor: "#8053ad" },
        ),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.18;
    group.add(halo);
    return group;
  }

  function makeAgentSystem() {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(2.55, 0, 0);
    const coreMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshPhysicalMaterial({
          color: 0xb7c8ff,
          emissive: 0x142c68,
          emissiveIntensity: 0.6,
          roughness: 0.16,
          metalness: 0.3,
          transmission: 0.22,
          clearcoat: 1,
          transparent: true,
        }),
        0.9,
        false,
      ),
      {
        darkColor: "#b7c8ff",
        lightColor: "#8fa6e8",
        darkEmissive: "#142c68",
        lightEmissive: "#4c64b1",
        darkEmissiveIntensity: 0.6,
        lightEmissiveIntensity: 0.36,
      },
    );
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 1.18, 1.18, 4, 4, 4),
      coreMaterial,
    );
    core.rotation.set(0.52, 0.74, 0.12);
    core.name = "agent-core";
    group.add(core);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 1.4, 1.4)),
      registerThemeMaterial(
        markMaterial(
          new THREE.LineBasicMaterial({
            color: 0xe6edff,
            transparent: true,
            opacity: 0.35,
          }),
          0.35,
          false,
        ),
        { darkColor: "#e6edff", lightColor: "#4d629e" },
      ),
    );
    edge.name = "agent-edge";
    group.add(edge);

    const satelliteMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshStandardMaterial({
          color: 0x7899ff,
          emissive: 0x132f73,
          emissiveIntensity: 0.5,
          roughness: 0.4,
          transparent: true,
        }),
        0.92,
        false,
      ),
      {
        darkColor: "#7899ff",
        lightColor: "#758dde",
        darkEmissive: "#132f73",
        lightEmissive: "#3b55a5",
        darkEmissiveIntensity: 0.5,
        lightEmissiveIntensity: 0.32,
      },
    );
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 16);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 2.05 + (i % 3) * 0.25;
      const position = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi) * radius,
        Math.cos(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius * 0.72,
      );
      points.push(position);
      const satellite = new THREE.Mesh(
        i % 3 === 0
          ? new THREE.OctahedronGeometry(0.13, 0)
          : new THREE.BoxGeometry(0.16, 0.16, 0.16),
        satelliteMaterial,
      );
      satellite.position.copy(position);
      satellite.rotation.set(theta, phi, theta * 0.4);
      satellite.name = `agent-satellite-${i}`;
      group.add(satellite);
    }

    const circuitMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.LineBasicMaterial({
          color: 0x789bff,
          transparent: true,
          opacity: 0.3,
        }),
        0.3,
        false,
      ),
      { darkColor: "#789bff", lightColor: "#4a62a7" },
    );
    points.forEach((position, index) => {
      const bend = position.clone().multiplyScalar(0.48);
      bend.setComponent(index % 3, 0);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        bend,
        position,
      ]);
      group.add(new THREE.Line(geometry, circuitMaterial));
    });
    return group;
  }

  function makeMusic() {
    const group = new THREE.Group() as SceneGroup;
    group.position.set(-2.45, -0.2, 0);
    const barMaterial = registerThemeMaterial(
      markMaterial(
        new THREE.MeshPhysicalMaterial({
          color: 0xff8fbd,
          emissive: 0x5b1636,
          emissiveIntensity: 0.72,
          roughness: 0.28,
          metalness: 0.14,
          transparent: true,
        }),
        0.92,
        false,
      ),
      {
        darkColor: "#ff8fbd",
        lightColor: "#df7fa7",
        darkEmissive: "#5b1636",
        lightEmissive: "#b74877",
        darkEmissiveIntensity: 0.72,
        lightEmissiveIntensity: 0.34,
      },
    );
    for (let i = 0; i < 44; i += 1) {
      const angle = (i / 44) * Math.PI * 2;
      const radius = 2.15;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.5, 0.06),
        barMaterial,
      );
      bar.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      bar.rotation.z = angle - Math.PI / 2;
      bar.name = `music-bar-${i}`;
      group.add(bar);
    }
    [0.9, 1.35, 1.78].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 8, 160),
          registerThemeMaterial(
            markMaterial(
              new THREE.MeshBasicMaterial({
                color: index === 1 ? 0xffd0e2 : 0xff8fbd,
                transparent: true,
                opacity: 0.22,
              }),
              0.22,
              false,
            ),
            {
              darkColor: index === 1 ? "#ffd0e2" : "#ff8fbd",
              lightColor: index === 1 ? "#a94c74" : "#c84f82",
            },
          ),
      );
      ring.name = `music-ring-${index}`;
      group.add(ring);
    });
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 28, 20),
      barMaterial,
    );
    center.name = "music-center";
    group.add(center);
    return group;
  }

  onMount(() => {
    document.documentElement.classList.add("about-page-active");
    document
      .querySelector("#light-dark-panel")
      ?.classList.add("float-panel-closed");
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;
    let playCountTimer: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let core: SceneGroup | null = null;
    let city: SceneGroup | null = null;
    let journey: SceneGroup | null = null;
    let network: SceneGroup | null = null;
    let octopus: SceneGroup | null = null;
    let agentSystem: SceneGroup | null = null;
    let music: SceneGroup | null = null;
    let stars: THREE.Points | null = null;
    let ambientLight: THREE.AmbientLight | null = null;
    let fillLight: THREE.HemisphereLight | null = null;
    let keyLight: THREE.PointLight | null = null;
    let rimLight: THREE.PointLight | null = null;
    let glowTexture: THREE.Texture | null = null;
    let themeObserver: MutationObserver | null = null;
    let lastFrameTime = 0;
    let firstFrameRendered = false;
    const lightAmbientColor = new THREE.Color(0xffffff);
    const darkAmbientColor = new THREE.Color(0x91a7d6);
    const lightGroundColor = new THREE.Color(0xe7d9d4);
    const darkGroundColor = new THREE.Color(0x151824);

    const syncTheme = (immediate = false) => {
      const nextIsDark = document.documentElement.classList.contains("dark");
      const changed = nextIsDark !== themeIsDark;
      themeIsDark = nextIsDark;
      themeTarget = nextIsDark ? 1 : 0;
      if (immediate) themeMix = themeTarget;
      if (changed && journey) updateJourneyLabelTheme(journey, nextIsDark);
    };

    syncTheme(true);
    themeObserver = new MutationObserver(() => syncTheme());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    try {
      const storedCount = Number(window.sessionStorage.getItem(playCountStorageKey));
      if (
        Number.isFinite(storedCount) &&
        storedCount >= playCountBase &&
        storedCount <= playCountMax
      ) {
        displayPlayCount = Math.floor(storedCount);
        playCountProgress = 1;
        playCountStarted = true;
      }
    } catch {
      // The animation still works when session storage is unavailable.
    }

    const persistPlayCount = () => {
      try {
        window.sessionStorage.setItem(
          playCountStorageKey,
          String(displayPlayCount),
        );
      } catch {
        // Persistence is a progressive enhancement.
      }
    };

    const schedulePlayCountTick = () => {
      if (
        disposed ||
        playCountTimer !== null ||
        displayPlayCount < playCountBase ||
        displayPlayCount >= playCountMax
      ) {
        return;
      }
      const delay = 200 + Math.random() * 100;
      playCountTimer = window.setTimeout(() => {
        playCountTimer = null;
        if (disposed) return;
        const increment = 1 + Math.floor(Math.random() * 9);
        displayPlayCount = Math.min(
          playCountMax,
          displayPlayCount + increment,
        );
        persistPlayCount();
        schedulePlayCountTick();
      }, delay);
    };

    const updateScroll = () => {
      if (!experience) return;
      const rect = experience.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      targetProgress = clamp(-rect.top / scrollable);
    };

    const updatePointer = (event: PointerEvent) => {
      pointerTargetX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTargetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedDetail) closeDetail();
    };

    const resize = () => {
      if (!renderer || !camera) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.75),
      );
      camera.aspect = width / height;
      camera.fov = width < 768 ? 58 : 48;
      camera.updateProjectionMatrix();
    };

    const yieldToBrowser = () =>
      new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const initializeScene = async () => {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: window.innerWidth >= 640,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = mix(1.14, 1.08, themeMix);

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(
          themeIsDark ? 0x05060a : 0xf4f6fb,
          mix(0.027, 0.045, themeMix),
        );
        camera = new THREE.PerspectiveCamera(48, 1, 0.1, 70);
        camera.position.set(0, 0.2, 8.7);

        ambientLight = new THREE.AmbientLight(
          themeIsDark ? 0x91a7d6 : 0xffffff,
          mix(1.5, 0.55, themeMix),
        );
        scene.add(ambientLight);
        fillLight = new THREE.HemisphereLight(
          themeIsDark ? 0xa8b8e5 : 0xffffff,
          themeIsDark ? 0x151824 : 0xe7d9d4,
          mix(1.15, 0.18, themeMix),
        );
        scene.add(fillLight);
        keyLight = new THREE.PointLight(0xa9c1ff, 22, 18, 2);
        keyLight.position.set(3.5, 4.5, 5);
        scene.add(keyLight);
        rimLight = new THREE.PointLight(0xff9a70, 15, 16, 2);
        rimLight.position.set(-4, -2, 3);
        scene.add(rimLight);

        glowTexture = makeGlowTexture();
        stars = makeStars(window.innerWidth < 768 ? 360 : 720);
        scene.add(stars);
        core = makeCore(glowTexture);
        scene.add(core);
        fadeGroup(core, 1);

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(document.documentElement);
        resize();
        await yieldToBrowser();
        if (disposed || !scene) return;

        city = makeChengdu();
        scene.add(city);
        fadeGroup(city, 0);
        await yieldToBrowser();
        if (disposed || !scene) return;

        journey = makeJourney(glowTexture);
        scene.add(journey);
        fadeGroup(journey, 0);
        await yieldToBrowser();
        if (disposed || !scene) return;

        network = makeNetwork();
        scene.add(network);
        fadeGroup(network, 0);
        await yieldToBrowser();
        if (disposed || !scene) return;

        octopus = makeOctopus();
        scene.add(octopus);
        fadeGroup(octopus, 0);
        await yieldToBrowser();
        if (disposed || !scene) return;

        agentSystem = makeAgentSystem();
        scene.add(agentSystem);
        fadeGroup(agentSystem, 0);
        await yieldToBrowser();
        if (disposed || !scene) return;

        music = makeMusic();
        scene.add(music);
        fadeGroup(music, 0);
        applyMaterialTheme(themeMix);
      } catch (error) {
        console.warn("The 3D About scene could not be initialized.", error);
        webglReady = false;
        window.requestAnimationFrame(() => {
          if (!disposed) sceneReady = true;
        });
      }
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = window.requestAnimationFrame(render);
      const delta = lastFrameTime
        ? Math.min(0.05, (time - lastFrameTime) * 0.001)
        : 1 / 60;
      lastFrameTime = time;
      progress = reducedMotion
        ? targetProgress
        : mix(progress, targetProgress, 0.075);
      if (Math.abs(progress - targetProgress) < 0.00008) progress = targetProgress;

      const themeEase = reducedMotion ? 1 : 1 - Math.exp(-delta * 8);
      themeMix = mix(themeMix, themeTarget, themeEase);
      if (Math.abs(themeMix - themeTarget) < 0.0005) themeMix = themeTarget;
      interpolatePalette(
        darkPalette,
        progress,
        darkSceneColor,
        darkSceneGlow,
      );
      interpolatePalette(
        lightPalette,
        progress,
        lightSceneColor,
        lightSceneGlow,
      );
      blendedSceneColor
        .copy(lightSceneColor)
        .lerp(darkSceneColor, themeMix);
      blendedSceneGlow.copy(lightSceneGlow).lerp(darkSceneGlow, themeMix);
      background = `#${blendedSceneColor.getHexString()}`;
      glow = `#${blendedSceneGlow.getHexString()}`;
      activeChapter = chapterStops.reduce(
        (closest, stop, index) =>
          Math.abs(stop - progress) < Math.abs(chapterStops[closest] - progress)
            ? index
            : closest,
        0,
      );

      if (!playCountStarted && progress >= chapterBounds(6).entry) {
        playCountStarted = true;
      }
      if (playCountStarted && displayPlayCount < playCountBase) {
        playCountProgress = reducedMotion
          ? 1
          : mix(playCountProgress, 1, 0.035);
        const easedCount = 1 - Math.pow(1 - clamp(playCountProgress), 4);
        displayPlayCount = Math.min(
          playCountBase,
          Math.round(playCountBase * easedCount),
        );
        if (displayPlayCount >= playCountBase) {
          playCountProgress = 1;
          persistPlayCount();
          schedulePlayCountTick();
        }
      } else if (displayPlayCount >= playCountBase) {
        schedulePlayCountTick();
      }

      if (!renderer || !scene || !camera || !core || !city || !journey || !network || !octopus || !agentSystem || !music) {
        return;
      }

      renderer.toneMappingExposure = mix(1.14, 1.08, themeMix);
      if (ambientLight) {
        ambientLight.intensity = mix(1.5, 0.55, themeMix);
        ambientLight.color
          .copy(lightAmbientColor)
          .lerp(darkAmbientColor, themeMix);
      }
      if (fillLight) {
        fillLight.intensity = mix(1.15, 0.18, themeMix);
        fillLight.color
          .copy(lightAmbientColor)
          .lerp(darkAmbientColor, themeMix);
        fillLight.groundColor
          .copy(lightGroundColor)
          .lerp(darkGroundColor, themeMix);
      }
      if (keyLight && rimLight) {
        keyLight.intensity = mix(16, 22, themeMix);
        rimLight.intensity = mix(10, 15, themeMix);
      }
      applyMaterialTheme(themeMix);

      const seconds = time * 0.001;
      const compactScene = window.innerWidth < 768;
      pointerX = mix(pointerX, pointerTargetX, 0.035);
      pointerY = mix(pointerY, pointerTargetY, 0.035);
      camera.position.x = pointerX * (window.innerWidth < 768 ? 0.12 : 0.3);
      camera.position.y = 0.15 - pointerY * 0.2;
      camera.position.z = 8.7 - Math.sin(progress * Math.PI) * 0.38;
      camera.lookAt(0, 0, 0);

      const chapterWeights = chapterStops.map((_, index) =>
        chapterAlpha(progress, index),
      );
      const heroFade = Math.max(chapterWeights[0], chapterWeights[7]);
      fadeGroup(core, heroFade);
      fadeGroup(city, chapterWeights[1]);
      fadeGroup(journey, chapterWeights[2]);
      fadeGroup(network, chapterWeights[3]);
      fadeGroup(octopus, chapterWeights[4]);
      fadeGroup(agentSystem, chapterWeights[5]);
      fadeGroup(music, chapterWeights[6]);

      if (core.visible) {
        const coreOffset = compactScene ? 1.15 : 1.65;
        core.position.x = progress > 0.87
          ? mix(coreOffset, 0, smoothstep(0.87, 0.98, progress))
          : coreOffset;
        core.rotation.y = seconds * 0.16 + progress * Math.PI * 2.2;
        core.rotation.x = Math.sin(seconds * 0.33) * 0.12;
        const shell = core.getObjectByName("core-shell");
        const wire = core.getObjectByName("core-wire");
        if (shell) shell.scale.setScalar(1 + Math.sin(seconds * 1.25) * 0.025);
        if (wire) wire.rotation.y = -seconds * 0.22;
        core.children
          .filter((child) => child.name.startsWith("core-ring"))
          .forEach((ring, index) => {
            ring.rotation.z += 0.001 + index * 0.00045;
            ring.rotation.x += 0.0004;
          });
      }

      if (city.visible) {
        city.rotation.y = -0.24 + chapterLocalProgress(progress, 1) * 0.36;
        city.position.set(
          compactScene ? 0.72 : 2.65,
          (compactScene ? 0.18 : -1.12) + Math.sin(seconds * 0.35) * 0.025,
          0,
        );
        city.scale.setScalar(compactScene ? 0.78 : 1);
      }

      if (journey.visible) {
      const journeyProgress = journeyTravelProgress(progress);
      const journeyAssembly = journey.getObjectByName("journey-assembly") as THREE.Group | null;
      if (journeyAssembly) {
        const curves = journeyAssembly.userData.curves as THREE.QuadraticBezierCurve3[];
        const scaledJourney = journeyProgress * curves.length;
        const segmentIndex = Math.min(
          curves.length - 1,
          Math.floor(scaledJourney),
        );
        const segmentProgress = segmentIndex === curves.length - 1 && scaledJourney >= curves.length
          ? 1
          : scaledJourney - segmentIndex;
        const travelerPosition = curves[segmentIndex].getPoint(
          clamp(segmentProgress),
        );
        const traveler = journeyAssembly.getObjectByName("journey-traveler");
        traveler?.position.copy(travelerPosition);

        const trail = journeyAssembly.getObjectByName("journey-trail") as THREE.Line | null;
        if (trail) {
          const totalPoints = trail.userData.totalPoints as number;
          trail.geometry.setDrawRange(
            0,
            Math.max(1, Math.round(totalPoints * journeyProgress)),
          );
        }

        journeyLocationIndex = Math.min(
          routeLocations.length - 1,
          Math.round(journeyProgress * (routeLocations.length - 1)),
        );
        const focusDirection = travelerPosition.clone().normalize();
        const frontDirection = new THREE.Vector3(0, 0, 1);
        const focusQuaternion = new THREE.Quaternion().setFromUnitVectors(
          focusDirection,
          frontDirection,
        );
        journeyAssembly.quaternion.slerp(focusQuaternion, 0.075);

        const journeyFade = journey.userData.fade ?? 0;
        routeLocations.forEach((location, index) => {
          const isCurrent = index === journeyLocationIndex;
          const isVisited = index < journeyLocationIndex;
          const point = journeyAssembly.getObjectByName(`journey-point-${index}`) as THREE.Mesh | null;
          const ring = journeyAssembly.getObjectByName(`journey-ring-${index}`) as THREE.Mesh | null;
          const label = journeyAssembly.getObjectByName(`journey-label-${index}`) as THREE.Sprite | null;
          if (point) {
            point.scale.setScalar(isCurrent ? 1.75 : isVisited ? 1.18 : 1);
            const material = point.material as THREE.MeshBasicMaterial;
            material.color.set(location.colors[0]);
            material.opacity = 0.95 * journeyFade * (isCurrent ? 1 : isVisited ? 0.72 : 0.38);
          }
          if (ring) {
            const pulse = isCurrent ? 1.25 + Math.sin(seconds * 3.2) * 0.16 : 1;
            ring.scale.setScalar(pulse);
            const material = ring.material as THREE.MeshBasicMaterial;
            material.color.set(location.colors[1]);
            material.opacity = 0.42 * journeyFade * (isCurrent ? 1 : isVisited ? 0.55 : 0.24);
          }
          if (label) {
            const labelScale = isCurrent ? 1.08 : 0.9;
            label.scale.set(1.78 * labelScale, 0.5 * labelScale, 1);
            const material = label.material as THREE.SpriteMaterial;
            material.opacity = 0.78 * journeyFade * (isCurrent ? 1 : isVisited ? 0.55 : 0.3);
          }
        });
      }
      journey.position.set(compactScene ? -0.15 : -2.65, compactScene ? 1.18 : -0.2, 0);
      journey.scale.setScalar(compactScene ? 0.72 : 1);

      }

      if (network.visible) {
      network.rotation.y = seconds * 0.09 + progress * 0.8;
      network.position.set(compactScene ? 0.35 : 2.55, compactScene ? 1.18 : 0, 0);
      network.scale.setScalar(compactScene ? 0.74 : 1);
      const networkCenter = network.getObjectByName("network-center");
      if (networkCenter) {
        networkCenter.rotation.x = seconds * 0.25;
        networkCenter.rotation.y = seconds * 0.32;
        networkCenter.scale.setScalar(1 + Math.sin(seconds * 1.8) * 0.055);
      }
      network.children
        .filter((child) => child.name.startsWith("network-panel"))
        .forEach((panel, index) => {
          panel.position.y += Math.sin(seconds * 0.8 + index) * 0.0007;
        });

      }

      if (octopus.visible) {
      octopus.rotation.y = -0.18 + Math.sin(seconds * 0.3) * 0.13;
      octopus.position.set(compactScene ? -0.55 : -2.55, compactScene ? 1.32 : -0.35, 0);
      octopus.scale.setScalar(compactScene ? 0.72 : 1);
      octopus.children
        .filter((child) => child.name.startsWith("tentacle"))
        .forEach((tentacle, index) => {
          tentacle.rotation.y = Math.sin(seconds * 0.75 + index * 0.8) * 0.045;
          tentacle.rotation.z = Math.cos(seconds * 0.62 + index) * 0.025;
        });

      }

      if (agentSystem.visible) {
      const agentCore = agentSystem.getObjectByName("agent-core");
      const agentEdge = agentSystem.getObjectByName("agent-edge");
      if (agentCore) {
        agentCore.rotation.x = seconds * 0.22;
        agentCore.rotation.y = seconds * 0.31;
      }
      if (agentEdge) {
        agentEdge.rotation.x = -seconds * 0.12;
        agentEdge.rotation.y = seconds * 0.18;
      }
      agentSystem.rotation.y = Math.sin(seconds * 0.25) * 0.12;
      agentSystem.position.set(compactScene ? 0.42 : 2.55, compactScene ? 1.15 : 0, 0);
      agentSystem.scale.setScalar(compactScene ? 0.72 : 1);

      }

      if (music.visible) {
      music.rotation.z = seconds * 0.035;
      music.position.set(compactScene ? -0.35 : -2.45, compactScene ? 1.2 : -0.2, 0);
      music.scale.setScalar(compactScene ? 0.74 : 1);
      music.children
        .filter((child) => child.name.startsWith("music-bar"))
        .forEach((bar, index) => {
          const beat = 0.7 + Math.abs(Math.sin(seconds * 2.2 + index * 0.52)) * 1.15;
          bar.scale.y = beat;
        });
      music.children
        .filter((child) => child.name.startsWith("music-ring"))
        .forEach((ring, index) => {
          const pulse = 1 + Math.sin(seconds * 1.8 - index * 0.7) * 0.055;
          ring.scale.setScalar(pulse);
        });

      }

      if (stars) {
        stars.rotation.y = seconds * 0.008 + progress * 0.16;
        stars.rotation.x = pointerY * 0.035;
      }
      if (keyLight && rimLight) {
        const lightColor = new THREE.Color(glow);
        keyLight.color.copy(lightColor);
        rimLight.color.copy(lightColor).offsetHSL(0.08, 0, -0.05);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set(background);
        scene.fog.density = mix(0.027, 0.045, themeMix);
      }
      renderer.render(scene, camera);
      if (!firstFrameRendered) {
        firstFrameRendered = true;
        window.requestAnimationFrame(() => {
          if (!disposed) sceneReady = true;
        });
      }
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    window.addEventListener("keydown", handleKeydown);
    frame = window.requestAnimationFrame(render);
    void initializeScene();

    return () => {
      disposed = true;
      document.documentElement.classList.remove("about-page-active");
      window.cancelAnimationFrame(frame);
      if (playCountTimer !== null) window.clearTimeout(playCountTimer);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("resize", updateScroll);
      window.removeEventListener("keydown", handleKeydown);
      themeObserver?.disconnect();
      resizeObserver?.disconnect();
      const disposedTextures = new Set<THREE.Texture>();
      scene?.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((material) => {
            const texture = (material as THREE.MeshBasicMaterial).map;
            if (texture && !disposedTextures.has(texture)) {
              disposedTextures.add(texture);
              texture.dispose();
            }
            material.dispose();
          });
        }
      });
      if (glowTexture && !disposedTextures.has(glowTexture)) glowTexture.dispose();
      themedMaterials.length = 0;
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  });

  $: heroAlpha = chapterAlpha(progress, 0);
  $: cityAlpha = chapterAlpha(progress, 1);
  $: journeyAlpha = chapterAlpha(progress, 2);
  $: glitterAlpha = chapterAlpha(progress, 3);
  $: octopusAlpha = chapterAlpha(progress, 4);
  $: agentAlpha = chapterAlpha(progress, 5);
  $: musicAlpha = chapterAlpha(progress, 6);
  $: finalAlpha = chapterAlpha(progress, 7);
  $: formattedPlayCount = displayPlayCount.toLocaleString("en-US");
  $: playCountComplete = displayPlayCount >= playCountMax;
</script>

<div bind:this={experience} class="about-experience" data-pagefind-ignore>
  <div class="journey-scroll-markers" aria-hidden="true">
    {#each routeLocations as _, index}
      <span
        id={`journey-stop-${index}`}
        style={`top:calc(${journeyLocationTarget(index) * 100}% - ${journeyLocationTarget(index) * 100}vh);`}
      ></span>
    {/each}
  </div>
  <div class="sticky-stage" style={`--scene-bg:${background}; --scene-glow:${glow};`}>
    <div
      class="experience-loader"
      class:ready={sceneReady}
      role="status"
      aria-live="polite"
      aria-hidden={sceneReady}
    >
      <div class="experience-loader__mark" aria-hidden="true">
        <span></span>
        <span></span>
        <i></i>
      </div>
      <div class="experience-loader__copy">
        <span>ABOUT · INTERACTIVE STORY</span>
        <strong>{webglReady ? "Building the experience" : "Opening the story"}</strong>
      </div>
      <div class="experience-loader__track" aria-hidden="true"><i></i></div>
    </div>
    <div class="scene-backdrop" aria-hidden="true">
      <canvas
        bind:this={canvas}
        class:canvas-fallback={!webglReady}
        aria-hidden="true"
      ></canvas>
      <div class="ambient-light"></div>
      <div class="grain"></div>
      <div class="vignette"></div>
    </div>

    <div class="progress-line" aria-hidden="true">
      <span style={`transform:scaleX(${progress});`}></span>
    </div>

    <nav class="chapter-nav" aria-label="About page chapters">
      {#each chapterLabels as label, index}
        <button
          class:active={activeChapter === index}
          aria-label={`Go to ${label}`}
          aria-current={activeChapter === index ? "step" : undefined}
          onclick={() => scrollToChapter(index)}
        >
          <span>{label}</span>
          <i></i>
        </button>
      {/each}
    </nav>

    <div class="chapter-layer">
      <section
        class="chapter hero"
        style={chapterStyle(progress, 0, 0)}
        aria-hidden={!reducedMotion && heroAlpha < 0.04}
      >
        <div class="hero-copy">
          <p class="eyebrow">ZHAOWEN DENG · ABOUT</p>
          <h1>I build intelligence<br /><em>for people.</em></h1>
          <p class="lede">
            Computer scientist, AI &amp; HCI researcher, and maker exploring how
            intelligent systems can feel more useful, responsible, and human.
          </p>
        </div>
        <div class="scroll-cue" aria-hidden="true">
          <span>Scroll to explore</span>
          <i></i>
        </div>
      </section>

      <section
        class="chapter align-left"
        style={chapterStyle(progress, 1)}
        aria-hidden={!reducedMotion && cityAlpha < 0.04}
      >
        <div class="copy-block">
          <p class="kicker">01 · ORIGIN <span>CHENGDU, CHINA</span></p>
          <h2>Where momentum meets an unhurried rhythm.</h2>
          <p class="body-copy">
            I come from Chengdu — a city where fast-moving ideas meet unhurried
            rhythms, and where technology and art feel equally at home. Its blend of
            momentum and pause taught me to pursue progress without losing
            imagination, texture, or a sense of beauty.
          </p>
          <p class="pull-quote">I want the things I build to hold both energies.</p>
        </div>
      </section>

      <section
        class="chapter align-right"
        style={chapterStyle(progress, 2, -1)}
        aria-hidden={!reducedMotion && journeyAlpha < 0.04}
      >
        <div class="copy-block journey-copy">
          <p class="kicker">02 · JOURNEY <span>ACROSS DISCIPLINES</span></p>
          <h2>One path.<br />Several ways of seeing.</h2>
          <p class="body-copy">
            My journey moves from Chengdu to Duke Kunshan and Duke, where I pursued
            a double major in Computation &amp; Design and Computer Science across both
            campuses, then through HCI research at HKUST(GZ), and now to an M.S. in
            Computer Science at Dartmouth.
          </p>
          <div class="route-heading">
            <span>SELECT A STOP</span>
            <small>Jump to its position and open its story</small>
          </div>
          <div class="route-list" aria-label="Academic route">
            {#each routeLocations as location, index}
              <a
                href={`#journey-stop-${index}`}
                style={`--brand-a:${location.colors[0]}; --brand-b:${location.colors[1]};`}
                class:active={journeyLocationIndex === index}
                class:visited={journeyLocationIndex > index}
                aria-current={journeyLocationIndex === index ? "location" : undefined}
                aria-label={`Show ${location.title} on the globe and open its story`}
                title={`${location.title} — ${location.detail}`}
                onclick={(event) => {
                  event.preventDefault();
                  openPlaceDetail(index);
                }}
              ><i></i><span>{location.label}</span><b aria-hidden="true">+</b></a>
            {/each}
          </div>
        </div>
      </section>

      <section
        class="chapter align-left"
        style={chapterStyle(progress, 3)}
        aria-hidden={!reducedMotion && glitterAlpha < 0.04}
      >
        <div class="copy-block research-copy">
          <p class="kicker">03 · RESEARCH <span>HUMAN–AI COLLABORATION</span></p>
          <h2>Agents should expand human judgment—not replace it.</h2>
          <p class="body-copy">
            I study how AI can work alongside practitioners and domain experts—
            surfacing useful alternatives, supporting reflection, and preserving
            human judgment in consequential decisions.
          </p>
          <div class="project-heading">
            <span>RELATED PAPER &amp; PROJECT</span>
            <small>Select to preview</small>
          </div>
          <div class="project-list">
            {#each humanAiProjects as project}
              <button
                type="button"
                style={`--brand-a:${project.colors[0]}; --brand-b:${project.colors[1]};`}
                tabindex={reducedMotion || glitterAlpha > 0.2 ? 0 : -1}
                onclick={() => openProjectDetail(project)}
              ><i></i><span>{project.label}</span><b aria-hidden="true">+</b></button>
            {/each}
          </div>
        </div>
      </section>

      <section
        class="chapter align-right"
        style={chapterStyle(progress, 4, -1)}
        aria-hidden={!reducedMotion && octopusAlpha < 0.04}
      >
        <div class="copy-block research-copy">
          <p class="kicker">04 · RESEARCH <span>AFFECTIVE COMPUTING</span></p>
          <h2>What if an AI could offer a hand—literally?</h2>
          <p class="body-copy">
            I build embodied, affect-aware systems that sense emotion through voice,
            vision, and touch—and respond through interactions that feel physically
            and socially meaningful.
          </p>
          <div class="project-heading">
            <span>RELATED PAPER &amp; PROJECT</span>
            <small>Select to preview</small>
          </div>
          <div class="project-list">
            {#each affectiveProjects as project}
              <button
                type="button"
                style={`--brand-a:${project.colors[0]}; --brand-b:${project.colors[1]};`}
                tabindex={reducedMotion || octopusAlpha > 0.2 ? 0 : -1}
                onclick={() => openProjectDetail(project)}
              ><i></i><span>{project.label}</span><b aria-hidden="true">+</b></button>
            {/each}
          </div>
        </div>
      </section>

      <section
        class="chapter align-left"
        style={chapterStyle(progress, 5)}
        aria-hidden={!reducedMotion && agentAlpha < 0.04}
      >
        <div class="copy-block">
          <p class="kicker">05 · BUILDING <span>INTELLIGENT AGENT SYSTEMS</span></p>
          <h2>From plausible outputs to accountable systems.</h2>
          <p class="body-copy">
            I design agentic systems as closed, inspectable loops—grounding action in
            evidence, verifying outcomes, learning from failure, and deciding when
            intervention is worth the cost.
          </p>
          <div class="logic-strip" aria-label="Agent loop">
            <span>Observe</span><i>→</i><span>Act</span><i>→</i><span>Verify</span><i>→</i><span>Learn</span>
          </div>
          <div class="project-heading compact">
            <span>RELATED SYSTEMS</span>
            <small>Select to preview</small>
          </div>
          <div class="project-list">
            {#each agentProjects as project}
              <button
                type="button"
                style={`--brand-a:${project.colors[0]}; --brand-b:${project.colors[1]};`}
                tabindex={reducedMotion || agentAlpha > 0.2 ? 0 : -1}
                onclick={() => openProjectDetail(project)}
              ><i></i><span>{project.label}</span><b aria-hidden="true">+</b></button>
            {/each}
          </div>
        </div>
      </section>

      <section
        class="chapter align-right"
        style={chapterStyle(progress, 6, -1)}
        aria-hidden={!reducedMotion && musicAlpha < 0.04}
      >
        <div class="copy-block music-copy">
          <p class="kicker">06 · BEYOND THE LAB <span>INTEREST</span></p>
          <h2>Sometimes ideas become systems. Sometimes breath becomes music.</h2>
          <p class="body-copy">
            I sing, record covers, and share them online. Music is the other half of
            how I think: timing, attention, emotion, and the space between notes.
          </p>
          <div class="play-count">
            <strong
              >{formattedPlayCount}{#if playCountComplete}<sup>+</sup>{/if}</strong
            >
            <span>plays on Tencent Music</span>
          </div>
        </div>
      </section>

      <section
        class="chapter final"
        style={chapterStyle(progress, 7, 0)}
        aria-hidden={!reducedMotion && finalAlpha < 0.04}
      >
        <div class="final-copy">
          <p class="kicker centered">THE STORY CONTINUES</p>
          <h2>Still learning.<br /><em>Still becoming.</em></h2>
          <p>
            I want to build intelligent systems that earn trust through what they do
            for people—and through what they choose not to do.
          </p>
          <div class="final-actions">
            <a
              class="primary-action"
              href="/series/"
              tabindex={reducedMotion || finalAlpha > 0.2 ? 0 : -1}
            >Explore my work <span>↗</span></a>
            <a
              class="secondary-action"
              href="mailto:d2862162699@gmail.com"
              tabindex={reducedMotion || finalAlpha > 0.2 ? 0 : -1}
            >Start a conversation</a>
          </div>
          <small>© 2026 Zhaowen Deng</small>
        </div>
      </section>
    </div>

    {#if selectedDetail}
      <div class="detail-popover" class:place-detail={selectedDetail.kind === "place"}>
        <div
          bind:this={detailPanel}
          class="detail-card"
          role="dialog"
          tabindex="-1"
          aria-labelledby={`detail-title-${selectedDetail.item.id}`}
          aria-describedby={`detail-summary-${selectedDetail.item.id}`}
          style={`--brand-a:${selectedDetail.item.colors[0]}; --brand-b:${selectedDetail.item.colors[1]};`}
        >
          <div class="detail-accent" aria-hidden="true"></div>
          <button
            type="button"
            class="detail-close"
            aria-label="Close details"
            onclick={closeDetail}
          ><span aria-hidden="true">×</span></button>

          {#if selectedDetail.kind === "place"}
            <p class="detail-eyebrow">JOURNEY STOP · {selectedDetail.item.detail}</p>
            <h3 id={`detail-title-${selectedDetail.item.id}`}>
              {selectedDetail.item.title}
            </h3>
            <p
              class="detail-summary"
              id={`detail-summary-${selectedDetail.item.id}`}
            >{selectedDetail.item.summary}</p>
            <div class="detail-location">
              <span>LOCATION</span>
              <strong>{selectedDetail.item.lat.toFixed(3)}°, {selectedDetail.item.lng.toFixed(3)}°</strong>
            </div>
          {:else}
            <p class="detail-eyebrow">{selectedDetail.item.eyebrow}</p>
            <h3 id={`detail-title-${selectedDetail.item.id}`}>
              {selectedDetail.item.title}
            </h3>
            <p
              class="detail-summary"
              id={`detail-summary-${selectedDetail.item.id}`}
            >{selectedDetail.item.summary}</p>
            <div class="detail-tags" aria-label="Project topics">
              {#each selectedDetail.item.tags as tag}
                <span>{tag}</span>
              {/each}
            </div>
            <a class="detail-link" href={selectedDetail.item.href}>
              {selectedDetail.item.cta}<span aria-hidden="true">↗</span>
            </a>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(html.about-page-active) {
    --about-initial-bg: #f4f6fb;
    --about-initial-glow: #4f67d6;
    --about-heading: #111827;
    --about-text: #172033;
    --about-copy: rgba(32, 43, 64, 0.72);
    --about-muted: rgba(32, 43, 64, 0.56);
    --about-faint: rgba(32, 43, 64, 0.38);
    --about-line: rgba(56, 72, 104, 0.14);
    --about-line-strong: rgba(56, 72, 104, 0.26);
    --about-glass: rgba(255, 255, 255, 0.58);
    --about-panel: rgba(252, 253, 255, 0.91);
    --about-chip: rgba(255, 255, 255, 0.52);
    --about-inset: rgba(255, 255, 255, 0.72);
    --about-shadow: rgba(42, 54, 82, 0.16);
    --about-brand-contrast: #111827;
    --about-primary-bg: #17213b;
    --about-primary-fg: #f8faff;
    --about-nav-primary: #6474d9;
    --about-nav-card: rgba(252, 253, 255, 0.96);
    --about-nav-text: rgba(26, 35, 54, 0.7);
    --about-nav-strong: #172033;
    --about-nav-brand: #596bd1;
    --about-nav-border: rgba(56, 72, 104, 0.12);
    --about-nav-icon: rgba(42, 53, 78, 0.58);
    --about-nav-placeholder: rgba(48, 58, 82, 0.38);
    --about-nav-search: rgba(255, 255, 255, 0.62);
    --about-nav-hover: rgba(91, 108, 193, 0.09);
    --about-nav-active: rgba(91, 108, 193, 0.15);
    --about-nav-bg-top: rgba(250, 251, 255, 0.97);
    --about-nav-bg-bottom: rgba(244, 247, 252, 0.91);
    --about-nav-wash: rgba(103, 119, 210, 0.1);
    --about-nav-shadow: rgba(42, 54, 82, 0.12);
    --about-canvas-filter: saturate(1.06) contrast(1.06) brightness(0.96);
    --about-ambient-blend: multiply;
    --about-ambient-opacity: 0.32;
    --about-grain-opacity: 0.025;
    --about-grain-blend: multiply;
    --about-vignette:
      linear-gradient(90deg, rgba(70, 84, 116, 0.1), transparent 35%, transparent 68%, rgba(70, 84, 116, 0.08)),
      linear-gradient(0deg, rgba(70, 84, 116, 0.12), transparent 22%, transparent 78%, rgba(70, 84, 116, 0.06));
    --about-mobile-vignette: linear-gradient(0deg, rgba(52, 66, 96, 0.13), transparent 48%, rgba(52, 66, 96, 0.04));
    color-scheme: light;
    background: var(--about-initial-bg) !important;
    scroll-behavior: auto;
  }

  :global(html.dark.about-page-active) {
    --about-initial-bg: #05060a;
    --about-initial-glow: #6f8dff;
    --about-heading: #f7f8fb;
    --about-text: #f6f7fb;
    --about-copy: rgba(235, 239, 248, 0.68);
    --about-muted: rgba(235, 240, 255, 0.62);
    --about-faint: rgba(255, 255, 255, 0.38);
    --about-line: rgba(255, 255, 255, 0.11);
    --about-line-strong: rgba(255, 255, 255, 0.22);
    --about-glass: rgba(5, 7, 12, 0.42);
    --about-panel: rgba(8, 11, 19, 0.9);
    --about-chip: rgba(255, 255, 255, 0.045);
    --about-inset: rgba(255, 255, 255, 0.04);
    --about-shadow: rgba(0, 0, 0, 0.46);
    --about-brand-contrast: #fff;
    --about-primary-bg: #fff;
    --about-primary-fg: #0a0b0f;
    --about-nav-primary: #a8b8ff;
    --about-nav-card: rgba(8, 11, 19, 0.96);
    --about-nav-text: rgba(235, 240, 255, 0.68);
    --about-nav-strong: #fff;
    --about-nav-brand: #c3ceff;
    --about-nav-border: rgba(166, 184, 255, 0.11);
    --about-nav-icon: rgba(218, 226, 255, 0.58);
    --about-nav-placeholder: rgba(224, 231, 255, 0.38);
    --about-nav-search: rgba(255, 255, 255, 0.055);
    --about-nav-hover: rgba(145, 165, 255, 0.12);
    --about-nav-active: rgba(145, 165, 255, 0.2);
    --about-nav-bg-top: rgba(5, 6, 10, 0.98);
    --about-nav-bg-bottom: rgba(7, 9, 16, 0.92);
    --about-nav-wash: rgba(126, 151, 255, 0.12);
    --about-nav-shadow: rgba(0, 0, 0, 0.42);
    --about-canvas-filter: none;
    --about-ambient-blend: screen;
    --about-ambient-opacity: 0.85;
    --about-grain-opacity: 0.035;
    --about-grain-blend: soft-light;
    --about-vignette:
      linear-gradient(90deg, rgba(0, 0, 0, 0.28), transparent 35%, transparent 68%, rgba(0, 0, 0, 0.24)),
      linear-gradient(0deg, rgba(0, 0, 0, 0.5), transparent 20%, transparent 78%, rgba(0, 0, 0, 0.18));
    --about-mobile-vignette: linear-gradient(0deg, rgba(0, 0, 0, 0.68), transparent 48%, rgba(0, 0, 0, 0.15));
    color-scheme: dark;
  }

  :global(html.about-page-active body) {
    background: var(--about-initial-bg) !important;
  }

  :global(html.about-page-active #banner-wrapper) {
    display: none !important;
  }

  :global(html.about-page-active #top-row) {
    --primary: var(--about-nav-primary);
    --card-bg: var(--about-nav-card);
    --float-panel-bg: var(--about-nav-card);
    --btn-plain-bg-hover: var(--about-nav-hover);
    --btn-plain-bg-active: var(--about-nav-active);
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    left: 0 !important;
    z-index: 100 !important;
    width: 100% !important;
    max-width: none !important;
    height: 4.5rem !important;
    padding: 0 clamp(0.65rem, 2vw, 1.5rem) !important;
    border-bottom: 1px solid var(--about-nav-border);
    color-scheme: inherit;
    background:
      linear-gradient(180deg, var(--about-nav-bg-top), var(--about-nav-bg-bottom)) !important;
    box-shadow: 0 0.8rem 2.4rem var(--about-nav-shadow);
    backdrop-filter: blur(24px) saturate(1.35);
    -webkit-backdrop-filter: blur(24px) saturate(1.35);
  }

  :global(html.about-page-active #navbar-wrapper),
  :global(html.about-page-active #navbar-wrapper.navbar-hidden) {
    top: 0 !important;
    width: 100%;
    max-width: var(--page-width);
    margin-inline: auto;
    opacity: 1 !important;
    transform: none !important;
  }

  :global(html.about-page-active #navbar > .absolute) {
    display: none !important;
  }

  :global(html.about-page-active #navbar > .card-base) {
    border: 0;
    border-radius: 0 !important;
    color: var(--about-nav-text);
    background: transparent !important;
    box-shadow: none;
    backdrop-filter: none;
  }

  :global(html.about-page-active #navbar .btn-plain) {
    color: var(--about-nav-text) !important;
  }

  :global(html.about-page-active #navbar .btn-plain:hover),
  :global(html.about-page-active #navbar .btn-plain:focus-visible),
  :global(html.about-page-active #navbar a[aria-label="About"]) {
    color: var(--about-nav-strong) !important;
  }

  :global(html.about-page-active #navbar > .card-base > a:first-of-type > div) {
    color: var(--about-nav-brand) !important;
    text-shadow: 0 0 1.25rem color-mix(in srgb, var(--about-nav-primary) 24%, transparent);
  }

  :global(html.about-page-active #navbar a[aria-label="About"]::after) {
    position: absolute;
    right: 1.25rem;
    bottom: 0.38rem;
    left: 1.25rem;
    height: 2px;
    border-radius: 999px;
    content: "";
    background: linear-gradient(90deg, #8ea8ff, #b596ff);
    box-shadow: 0 0 0.75rem rgba(142, 168, 255, 0.52);
  }

  :global(html.about-page-active #search-bar),
  :global(html.about-page-active #search-bar-inside) {
    border: 1px solid var(--about-nav-border);
    background: var(--about-nav-search) !important;
    box-shadow: inset 0 1px color-mix(in srgb, var(--about-nav-strong) 5%, transparent);
  }

  :global(html.about-page-active #search-bar:hover),
  :global(html.about-page-active #search-bar:focus-within),
  :global(html.about-page-active #search-bar-inside:focus-within) {
    border-color: color-mix(in srgb, var(--about-nav-primary) 32%, transparent);
    background: var(--about-nav-hover) !important;
  }

  :global(html.about-page-active #search-bar input),
  :global(html.about-page-active #search-bar-inside input) {
    color: var(--about-nav-strong) !important;
  }

  :global(html.about-page-active #search-bar input::placeholder),
  :global(html.about-page-active #search-bar-inside input::placeholder) {
    color: var(--about-nav-placeholder) !important;
  }

  :global(html.about-page-active #search-bar svg),
  :global(html.about-page-active #search-bar-inside svg),
  :global(html.about-page-active #search-switch svg),
  :global(html.about-page-active #scheme-switch svg),
  :global(html.about-page-active #nav-menu-switch svg),
  :global(html.about-page-active #display-settings-switch svg) {
    color: var(--about-nav-icon) !important;
  }

  :global(html.about-page-active #search-panel),
  :global(html.about-page-active #nav-menu-panel),
  :global(html.about-page-active #display-setting),
  :global(html.about-page-active #light-dark-panel > .card-base) {
    border: 1px solid var(--about-nav-border);
    color: var(--about-nav-text);
    background:
      radial-gradient(circle at 15% 0%, var(--about-nav-wash), transparent 38%),
      var(--about-nav-card) !important;
    box-shadow: 0 1.25rem 3.5rem var(--about-nav-shadow), inset 0 1px color-mix(in srgb, var(--about-nav-strong) 5%, transparent);
    backdrop-filter: blur(24px) saturate(1.25);
    -webkit-backdrop-filter: blur(24px) saturate(1.25);
  }

  :global(html.about-page-active #nav-menu-panel a > div),
  :global(html.about-page-active #search-panel .text-90) {
    color: var(--about-nav-text) !important;
  }

  :global(html.about-page-active #search-panel .text-50) {
    color: var(--about-nav-placeholder) !important;
  }

  :global(html.about-page-active #nav-menu-panel a:hover > div),
  :global(html.about-page-active #nav-menu-panel a:focus-visible > div) {
    color: var(--about-nav-primary) !important;
  }

  :global(html.about-page-active #main-grid) {
    display: block !important;
    transform: none !important;
    padding: 0 !important;
  }

  :global(html.about-page-active #main-grid > :not(main)),
  :global(html.about-page-active #content-wrapper > .footer),
  :global(html.about-page-active #toc-wrapper),
  :global(html.about-page-active #back-to-top-btn) {
    display: none !important;
  }

  :global(html.about-page-active #main-grid > main) {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    overflow: visible !important;
  }

  :global(html.about-page-active #content-wrapper) {
    overflow: visible !important;
  }

  :global(html.about-page-active .transition-swup-fade) {
    overflow: visible;
  }

  .about-experience {
    position: relative;
    left: 50%;
    width: 100vw;
    max-width: 100vw;
    height: 1020vh;
    margin-top: calc(-35vh + 8rem);
    margin-left: -50vw;
    color: var(--about-text);
    background: var(--about-initial-bg);
    font-family:
      -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter,
      Helvetica, Arial, sans-serif;
    isolation: isolate;
  }

  .journey-scroll-markers {
    display: contents;
  }

  .journey-scroll-markers span {
    position: absolute;
    left: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }

  .sticky-stage {
    position: sticky;
    top: 0;
    width: 100%;
    height: 100svh;
    min-height: 42rem;
    overflow: hidden;
    background: var(--scene-bg);
    transition: background-color 0.45s linear;
  }

  .experience-loader {
    position: absolute;
    z-index: 80;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1.2rem;
    padding: 1.5rem;
    color: var(--about-heading);
    background:
      radial-gradient(circle at 50% 44%, color-mix(in srgb, var(--about-initial-glow) 14%, transparent), transparent 28rem),
      var(--about-initial-bg);
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity 680ms cubic-bezier(0.22, 1, 0.36, 1),
      visibility 680ms step-end;
  }

  .experience-loader.ready {
    display: none;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .experience-loader__mark {
    position: relative;
    width: 4.8rem;
    height: 4.8rem;
  }

  .experience-loader__mark span {
    position: absolute;
    inset: 0;
    border: 1px solid var(--about-line-strong);
    border-radius: 50%;
    animation: experience-loader-spin 1.75s linear infinite;
  }

  .experience-loader__mark span::after {
    position: absolute;
    top: -0.2rem;
    left: 50%;
    width: 0.44rem;
    height: 0.44rem;
    border-radius: 50%;
    content: "";
    background: var(--about-initial-glow);
    box-shadow: 0 0 1.2rem var(--about-initial-glow);
    transform: translateX(-50%);
  }

  .experience-loader__mark span:nth-child(2) {
    inset: 0.72rem;
    border-color: color-mix(in srgb, var(--about-initial-glow) 35%, transparent);
    animation-duration: 1.2s;
    animation-direction: reverse;
  }

  .experience-loader__mark span:nth-child(2)::after {
    top: auto;
    right: -0.17rem;
    bottom: 0.32rem;
    left: auto;
    width: 0.34rem;
    height: 0.34rem;
    transform: none;
  }

  .experience-loader__mark i {
    position: absolute;
    inset: 1.8rem;
    border-radius: 50%;
    background: var(--about-initial-glow);
    box-shadow: 0 0 1.6rem color-mix(in srgb, var(--about-initial-glow) 55%, transparent);
    animation: experience-loader-breathe 1.45s ease-in-out infinite;
  }

  .experience-loader__copy {
    display: grid;
    justify-items: center;
    gap: 0.36rem;
    text-align: center;
  }

  .experience-loader__copy span {
    color: var(--about-faint);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.2em;
  }

  .experience-loader__copy strong {
    color: var(--about-heading);
    font-size: 0.96rem;
    font-weight: 560;
    letter-spacing: -0.01em;
  }

  .experience-loader__track {
    width: min(12rem, 45vw);
    height: 1px;
    overflow: hidden;
    background: var(--about-line);
  }

  .experience-loader__track i {
    display: block;
    width: 48%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--about-initial-glow), transparent);
    animation: experience-loader-track 1.35s ease-in-out infinite;
  }

  @keyframes experience-loader-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes experience-loader-breathe {
    0%, 100% { opacity: 0.62; transform: scale(0.82); }
    50% { opacity: 1; transform: scale(1.08); }
  }

  @keyframes experience-loader-track {
    from { transform: translateX(-110%); }
    to { transform: translateX(320%); }
  }

  .scene-backdrop,
  .chapter-layer,
  .chapter {
    position: absolute;
    inset: 0;
  }

  .scene-backdrop {
    overflow: hidden;
    background:
      radial-gradient(circle at 62% 44%, color-mix(in srgb, var(--scene-glow) 13%, transparent), transparent 31%),
      radial-gradient(circle at 20% 100%, color-mix(in srgb, var(--scene-glow) 8%, transparent), transparent 34%),
      var(--scene-bg);
    transition: background 0.45s linear;
  }

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    filter: var(--about-canvas-filter);
    transition: opacity 0.6s ease, filter 0.45s ease;
  }

  canvas.canvas-fallback {
    opacity: 0;
  }

  .ambient-light {
    position: absolute;
    inset: -20%;
    background:
      radial-gradient(circle at 70% 42%, color-mix(in srgb, var(--scene-glow) 11%, transparent), transparent 23%),
      radial-gradient(circle at 38% 72%, color-mix(in srgb, var(--scene-glow) 6%, transparent), transparent 28%);
    filter: blur(40px);
    mix-blend-mode: var(--about-ambient-blend);
    opacity: var(--about-ambient-opacity);
    transition: opacity 0.45s ease;
    pointer-events: none;
  }

  .grain {
    position: absolute;
    inset: 0;
    opacity: var(--about-grain-opacity);
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
    background-size: 160px;
    mix-blend-mode: var(--about-grain-blend);
  }

  .vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--about-vignette);
  }

  .progress-line {
    position: absolute;
    z-index: 30;
    top: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--about-line);
  }

  .progress-line span {
    display: block;
    width: 100%;
    height: 100%;
    transform-origin: left center;
    background: linear-gradient(90deg, var(--about-line-strong), var(--scene-glow));
    box-shadow: 0 0 18px var(--scene-glow);
  }

  .chapter-nav {
    position: absolute;
    z-index: 40;
    top: 50%;
    right: clamp(1rem, 2.2vw, 2.5rem);
    display: flex;
    flex-direction: column;
    gap: 0.76rem;
    transform: translateY(-50%);
  }

  .chapter-nav button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 5.8rem;
    min-height: 1rem;
    padding: 0;
    border: 0;
    color: var(--about-muted);
    background: transparent;
    cursor: pointer;
  }

  .chapter-nav button span {
    position: absolute;
    right: 1.15rem;
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    opacity: 0;
    transform: translateX(0.35rem);
    transition: opacity 0.25s ease, transform 0.25s ease;
    white-space: nowrap;
  }

  .chapter-nav button i {
    display: block;
    width: 4px;
    height: 4px;
    border: 1px solid var(--about-line-strong);
    border-radius: 999px;
    background: transparent;
    transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .chapter-nav button:hover span,
  .chapter-nav button:focus-visible span,
  .chapter-nav button.active span {
    opacity: 1;
    transform: translateX(0);
  }

  .chapter-nav button.active {
    color: var(--about-heading);
  }

  .chapter-nav button.active i {
    width: 5px;
    height: 18px;
    border-color: var(--scene-glow);
    background: var(--scene-glow);
    box-shadow: 0 0 14px color-mix(in srgb, var(--scene-glow) 65%, transparent);
  }

  .chapter-nav button:focus-visible {
    outline: 1px solid var(--about-line-strong);
    outline-offset: 5px;
    border-radius: 999px;
  }

  .chapter-layer {
    z-index: 10;
    pointer-events: none;
  }

  .chapter {
    display: flex;
    align-items: center;
    padding: clamp(5.8rem, 10vh, 8.5rem) clamp(1.5rem, 8vw, 9rem) 3rem;
    will-change: opacity, transform, filter;
    pointer-events: none;
  }

  .chapter[aria-hidden="true"] {
    visibility: hidden;
  }

  .chapter a,
  .chapter button {
    pointer-events: auto;
  }

  .hero {
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .hero-copy {
    width: min(70rem, 92vw);
    margin-top: -2vh;
  }

  .eyebrow,
  .kicker {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    margin: 0 0 1.15rem;
    color: var(--about-muted);
    font-size: clamp(0.68rem, 0.75vw, 0.78rem);
    font-weight: 680;
    letter-spacing: 0.18em;
    line-height: 1.3;
  }

  .eyebrow {
    justify-content: center;
  }

  .hero h1,
  .chapter h2 {
    margin: 0;
    color: var(--about-heading);
    font-weight: 650;
    letter-spacing: -0.055em;
    text-wrap: balance;
  }

  .hero h1 {
    font-size: clamp(4rem, 9vw, 9rem);
    line-height: 0.91;
  }

  .hero h1 em,
  .final h2 em {
    color: transparent;
    font-style: normal;
    background: linear-gradient(
      112deg,
      var(--about-heading) 8%,
      color-mix(in srgb, var(--scene-glow) 72%, var(--about-heading)) 48%,
      color-mix(in srgb, var(--about-heading) 58%, var(--about-muted)) 95%
    );
    background-clip: text;
    -webkit-background-clip: text;
  }

  .lede {
    width: min(39rem, 82vw);
    margin: 2rem auto 0;
    color: var(--about-muted);
    font-size: clamp(1rem, 1.35vw, 1.28rem);
    line-height: 1.65;
    text-wrap: balance;
  }

  .scroll-cue {
    position: absolute;
    bottom: max(1.7rem, 4vh);
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    transform: translateX(-50%);
    color: var(--about-faint);
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .scroll-cue i {
    position: relative;
    width: 1px;
    height: 2.5rem;
    overflow: hidden;
    background: var(--about-line);
  }

  .scroll-cue i::after {
    position: absolute;
    inset: 0;
    content: "";
    background: linear-gradient(transparent, var(--about-heading), transparent);
    animation: scroll-pulse 2.1s ease-in-out infinite;
  }

  @keyframes scroll-pulse {
    0% { transform: translateY(-100%); }
    70%, 100% { transform: translateY(100%); }
  }

  .align-left {
    justify-content: flex-start;
  }

  .align-right {
    justify-content: flex-end;
  }

  .copy-block {
    width: min(38rem, 43vw);
    padding: clamp(1.2rem, 2.5vw, 2.1rem) 0;
  }

  .align-right .copy-block {
    margin-right: clamp(1rem, 4vw, 4.5rem);
  }

  .kicker span {
    color: color-mix(in srgb, var(--scene-glow) 76%, var(--about-heading));
  }

  .kicker.centered {
    justify-content: center;
  }

  .chapter h2 {
    max-width: 12ch;
    font-size: clamp(2.75rem, 5.25vw, 5.8rem);
    line-height: 0.98;
  }

  .body-copy {
    max-width: 38rem;
    margin: 1.65rem 0 0;
    color: var(--about-copy);
    font-size: clamp(0.98rem, 1.17vw, 1.18rem);
    line-height: 1.72;
  }

  .pull-quote {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 1.5rem 0 0;
    color: var(--about-text);
    font-size: 0.92rem;
    font-weight: 620;
  }

  .pull-quote::before {
    width: 2.1rem;
    height: 1px;
    content: "";
    background: var(--scene-glow);
    box-shadow: 0 0 10px var(--scene-glow);
  }

  .route-list,
  .logic-strip,
  .project-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem;
    margin-top: 1.5rem;
  }

  .route-heading,
  .project-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    max-width: 38rem;
    margin-top: 1.5rem;
    color: var(--about-faint);
  }

  .route-heading span,
  .project-heading span {
    color: var(--about-muted);
    font-size: 0.61rem;
    font-weight: 720;
    letter-spacing: 0.16em;
  }

  .route-heading small,
  .project-heading small {
    font-size: 0.66rem;
    letter-spacing: 0.02em;
  }

  .route-heading + .route-list,
  .project-heading + .project-list,
  .project-heading.compact {
    margin-top: 0.68rem;
  }

  .route-list a,
  .logic-strip span,
  .project-list button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2rem;
    padding: 0.42rem 0.72rem;
    border: 1px solid var(--about-line);
    border-radius: 999px;
    color: var(--about-copy);
    background: var(--about-chip);
    box-shadow: inset 0 1px var(--about-inset);
    backdrop-filter: blur(12px);
    font-size: 0.72rem;
    font-weight: 610;
    letter-spacing: 0.015em;
  }

  .route-list a {
    --brand-a: #7fa5ff;
    --brand-b: var(--brand-a);
    position: relative;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--brand-a) 36%, var(--about-line));
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--brand-a) 13%, transparent), color-mix(in srgb, var(--brand-b) 13%, transparent)),
      var(--about-chip);
    cursor: pointer;
    text-decoration: none;
    opacity: 0.58;
    transform: translateY(0);
    transition:
      opacity 0.45s ease,
      color 0.45s ease,
      border-color 0.45s ease,
      box-shadow 0.45s ease,
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .route-list a.visited {
    opacity: 0.7;
  }

  .route-list a.active {
    border-color: color-mix(in srgb, var(--brand-a) 72%, var(--about-brand-contrast) 12%);
    color: var(--about-heading);
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--brand-a) 27%, transparent), color-mix(in srgb, var(--brand-b) 27%, transparent)),
      var(--about-chip);
    box-shadow:
      inset 0 1px var(--about-inset),
      0 0 1.4rem color-mix(in srgb, var(--brand-a) 24%, transparent);
    opacity: 1;
    transform: translateY(-2px);
  }

  .route-list a:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--brand-a) 78%, var(--about-brand-contrast));
    outline-offset: 3px;
  }

  .route-list a i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--brand-a), var(--brand-b));
    box-shadow: 0 0 9px color-mix(in srgb, var(--brand-a) 75%, transparent);
    transition: width 0.4s ease, background-color 0.4s ease;
  }

  .route-list a.active i {
    width: 0.9rem;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--brand-a), var(--brand-b));
  }

  .route-list a b,
  .project-list button b {
    margin-left: 0.05rem;
    color: var(--about-faint);
    font-size: 0.84rem;
    font-weight: 400;
    line-height: 1;
    transition: color 0.25s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .route-list a:hover b,
  .route-list a:focus-visible b,
  .project-list button:hover b,
  .project-list button:focus-visible b {
    color: var(--about-heading);
    transform: rotate(90deg);
  }

  .project-list {
    margin-top: 0.68rem;
  }

  .project-list button {
    --brand-a: var(--scene-glow);
    --brand-b: var(--brand-a);
    position: relative;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--brand-a) 38%, var(--about-line));
    color: var(--about-text);
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--brand-a) 15%, transparent), color-mix(in srgb, var(--brand-b) 15%, transparent)),
      var(--about-chip);
    cursor: pointer;
    font-family: inherit;
    transition:
      border-color 0.3s ease,
      box-shadow 0.3s ease,
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .project-list button:hover,
  .project-list button:focus-visible {
    border-color: color-mix(in srgb, var(--brand-a) 72%, var(--about-brand-contrast) 10%);
    box-shadow: 0 0 1.6rem color-mix(in srgb, var(--brand-a) 18%, transparent);
    outline: none;
    transform: translateY(-2px);
  }

  .project-list button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--brand-a) 72%, var(--about-brand-contrast));
    outline-offset: 3px;
  }

  .project-list button i {
    width: 0.82rem;
    height: 0.28rem;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--brand-a), var(--brand-b));
    box-shadow: 0 0 0.9rem color-mix(in srgb, var(--brand-a) 70%, transparent);
  }

  .final-actions a:focus-visible {
    outline: 2px solid var(--scene-glow);
    outline-offset: 5px;
    border-radius: 3px;
  }

  .detail-popover {
    position: absolute;
    z-index: 70;
    inset: 0;
    pointer-events: none;
  }

  .detail-card {
    --brand-a: #7fa5ff;
    --brand-b: var(--brand-a);
    position: absolute;
    right: clamp(4.5rem, 8vw, 9rem);
    bottom: clamp(1.5rem, 5.5vh, 4rem);
    width: min(27rem, calc(100vw - 3rem));
    max-height: calc(100svh - 8rem);
    overflow-y: auto;
    padding: 1.5rem 1.55rem 1.45rem;
    border: 1px solid color-mix(in srgb, var(--brand-a) 34%, var(--about-line));
    border-radius: 1.6rem;
    color: var(--about-text);
    background:
      radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--brand-a) 17%, transparent), transparent 42%),
      radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--brand-b) 12%, transparent), transparent 44%),
      var(--about-panel);
    box-shadow:
      0 1.75rem 5rem var(--about-shadow),
      inset 0 1px var(--about-inset);
    backdrop-filter: blur(28px) saturate(1.25);
    outline: none;
    pointer-events: auto;
    animation: detail-enter 0.48s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .place-detail .detail-card {
    right: auto;
    left: clamp(1.5rem, 7vw, 8rem);
  }

  @keyframes detail-enter {
    from {
      opacity: 0;
      transform: translate3d(0, 1rem, 0) scale(0.975);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  .detail-accent {
    position: absolute;
    top: 0;
    right: 1.6rem;
    left: 1.6rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--brand-a), var(--brand-b), transparent);
    box-shadow: 0 0 1.2rem color-mix(in srgb, var(--brand-a) 45%, transparent);
  }

  .detail-close {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    display: grid;
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    border: 1px solid var(--about-line);
    border-radius: 50%;
    color: var(--about-muted);
    background: var(--about-chip);
    cursor: pointer;
    font-family: inherit;
    font-size: 1.25rem;
    line-height: 1;
    place-items: center;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.25s ease;
  }

  .detail-close:hover,
  .detail-close:focus-visible {
    border-color: color-mix(in srgb, var(--brand-a) 58%, var(--about-brand-contrast) 12%);
    color: var(--about-heading);
    background: color-mix(in srgb, var(--brand-a) 14%, var(--about-chip));
    outline: none;
    transform: rotate(8deg);
  }

  .detail-close:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--brand-a) 72%, var(--about-brand-contrast));
    outline-offset: 2px;
  }

  .detail-eyebrow {
    max-width: calc(100% - 2.5rem);
    margin: 0 0 0.75rem;
    color: color-mix(in srgb, var(--brand-a) 62%, var(--about-brand-contrast));
    font-size: 0.62rem;
    font-weight: 720;
    letter-spacing: 0.14em;
    line-height: 1.5;
  }

  .detail-card h3 {
    margin: 0;
    padding-right: 2.2rem;
    color: var(--about-heading);
    font-size: clamp(1.75rem, 3vw, 2.55rem);
    font-weight: 660;
    letter-spacing: -0.045em;
    line-height: 1;
  }

  .detail-summary {
    margin: 1rem 0 0;
    color: var(--about-copy);
    font-size: 0.91rem;
    line-height: 1.65;
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.42rem;
    margin-top: 1.05rem;
  }

  .detail-tags span {
    padding: 0.34rem 0.58rem;
    border: 1px solid color-mix(in srgb, var(--brand-a) 25%, var(--about-line));
    border-radius: 999px;
    color: var(--about-copy);
    background: color-mix(in srgb, var(--brand-a) 7%, var(--about-chip));
    font-size: 0.64rem;
    font-weight: 610;
  }

  .detail-link {
    display: inline-flex;
    align-items: center;
    gap: 0.48rem;
    margin-top: 1.2rem;
    padding-bottom: 0.18rem;
    border-bottom: 1px solid color-mix(in srgb, var(--brand-a) 54%, transparent);
    color: var(--about-heading);
    font-size: 0.82rem;
    font-weight: 680;
    text-decoration: none;
    transition: gap 0.25s ease, color 0.25s ease, border-color 0.25s ease;
  }

  .detail-link:hover,
  .detail-link:focus-visible {
    gap: 0.72rem;
    border-color: var(--brand-a);
    color: color-mix(in srgb, var(--brand-a) 60%, var(--about-brand-contrast));
    outline: none;
  }

  .detail-location {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.2rem;
    padding-top: 0.9rem;
    border-top: 1px solid var(--about-line);
  }

  .detail-location span {
    color: var(--about-faint);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  .detail-location strong {
    color: var(--about-copy);
    font-size: 0.68rem;
    font-weight: 590;
    letter-spacing: 0.035em;
  }

  .logic-strip {
    flex-wrap: nowrap;
  }

  .logic-strip i {
    color: var(--about-faint);
    font-style: normal;
  }

  .music-copy {
    width: min(43rem, 46vw);
  }

  .music-copy h2 {
    max-width: 14ch;
    font-size: clamp(2.7rem, 4.4vw, 5rem);
    line-height: 0.96;
  }

  .music-copy .body-copy {
    margin-top: 1.2rem;
    line-height: 1.6;
  }

  .play-count {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin-top: 1.1rem;
  }

  .play-count strong {
    color: var(--about-heading);
    min-width: 5.8ch;
    font-variant-numeric: tabular-nums;
    font-size: clamp(3.2rem, 5.2vw, 5.8rem);
    font-weight: 650;
    letter-spacing: -0.065em;
    line-height: 0.8;
  }

  .play-count sup {
    position: relative;
    top: -0.25em;
    color: var(--scene-glow);
    font-size: 0.36em;
  }

  .play-count span {
    max-width: 9rem;
    color: var(--about-muted);
    font-size: 0.7rem;
    font-weight: 610;
    letter-spacing: 0.09em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  @media (min-width: 901px) and (max-height: 820px) {
    .music-copy {
      width: min(44rem, 48vw);
    }

    .music-copy h2 {
      font-size: clamp(2.45rem, 4vw, 4.25rem);
      line-height: 0.94;
    }

    .music-copy .body-copy {
      margin-top: 0.9rem;
      font-size: 0.98rem;
      line-height: 1.5;
    }

    .music-copy .play-count {
      margin-top: 0.85rem;
    }

    .music-copy .play-count strong {
      font-size: clamp(2.8rem, 4.5vw, 4.8rem);
    }
  }

  .final {
    justify-content: center;
    text-align: center;
  }

  .final-copy {
    width: min(64rem, 90vw);
  }

  .final h2 {
    max-width: none;
    font-size: clamp(4rem, 8vw, 8rem);
    line-height: 0.9;
  }

  .final-copy > p:not(.kicker) {
    width: min(38rem, 82vw);
    margin: 1.75rem auto 0;
    color: var(--about-muted);
    font-size: clamp(1rem, 1.3vw, 1.22rem);
    line-height: 1.65;
  }

  .final-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .final-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3.1rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--about-line-strong);
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 650;
    text-decoration: none;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease, border-color 0.25s ease;
  }

  .final-actions a:hover {
    transform: translateY(-2px);
  }

  .primary-action {
    gap: 0.55rem;
    border-color: var(--about-primary-bg) !important;
    color: var(--about-primary-fg);
    background: var(--about-primary-bg);
  }

  .primary-action:hover {
    background: color-mix(in srgb, var(--scene-glow) 15%, var(--about-primary-bg));
  }

  .secondary-action {
    color: var(--about-heading);
    background: var(--about-chip);
    backdrop-filter: blur(14px);
  }

  .secondary-action:hover {
    border-color: var(--about-line-strong);
    background: color-mix(in srgb, var(--about-chip) 78%, var(--scene-glow) 12%);
  }

  .final small {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    color: var(--about-faint);
    font-size: 0.64rem;
    letter-spacing: 0.08em;
    transform: translateX(-50%);
  }

  @media (max-width: 900px) {
    .about-experience {
      margin-top: calc(-35vh + 7.5rem);
    }

    .chapter {
      align-items: flex-end;
      justify-content: flex-start;
      padding: 7rem 1.35rem max(3.2rem, 8vh);
    }

    .hero,
    .final {
      align-items: center;
      justify-content: center;
    }

    .copy-block,
    .align-right .copy-block {
      width: min(36rem, calc(100vw - 4.5rem));
      margin: 0;
      padding: 1.1rem 1.15rem 1.2rem;
      border: 1px solid var(--about-line);
      border-radius: 1.35rem;
      background: var(--about-glass);
      box-shadow: 0 1.2rem 4rem var(--about-shadow), inset 0 1px var(--about-inset);
      backdrop-filter: blur(18px) saturate(1.1);
    }

    .chapter h2 {
      max-width: 15ch;
      font-size: clamp(2.35rem, 9.8vw, 4.7rem);
    }

    .body-copy {
      margin-top: 1rem;
      font-size: 0.92rem;
      line-height: 1.58;
    }

    .chapter-nav {
      right: 0.65rem;
    }

    .chapter-nav button {
      width: 1rem;
    }

    .chapter-nav button span {
      display: none;
    }

    .vignette {
      background: var(--about-mobile-vignette);
    }

    .route-list,
    .logic-strip,
    .project-list {
      margin-top: 1rem;
    }

    .route-heading,
    .project-heading {
      margin-top: 1rem;
    }

    .route-heading + .route-list,
    .project-heading + .project-list,
    .project-heading.compact,
    .project-list {
      margin-top: 0.58rem;
    }

    .detail-card,
    .place-detail .detail-card {
      right: 1.35rem;
      bottom: 1.35rem;
      left: auto;
      width: min(25rem, calc(100vw - 4.25rem));
      max-height: calc(100svh - 7.5rem);
    }

  }

  @media (max-width: 560px) {
    .about-experience {
      height: 960vh;
    }

    .sticky-stage {
      min-height: 38rem;
    }

    .hero-copy {
      margin-top: -7vh;
    }

    .hero h1 {
      font-size: clamp(3.55rem, 17vw, 5.8rem);
    }

    .lede {
      width: min(21rem, 84vw);
      margin-top: 1.35rem;
      font-size: 0.94rem;
      line-height: 1.55;
    }

    .eyebrow,
    .kicker {
      font-size: 0.6rem;
      letter-spacing: 0.13em;
    }

    .copy-block,
    .align-right .copy-block {
      width: calc(100vw - 3.5rem);
      max-height: calc(100svh - 8.5rem);
      overflow-y: auto;
      padding: 1rem;
    }

    .chapter h2 {
      font-size: clamp(2.05rem, 10.5vw, 3.35rem);
      line-height: 1;
    }

    .route-list a,
    .logic-strip span,
    .project-list button {
      min-height: 1.8rem;
      padding: 0.34rem 0.58rem;
      font-size: 0.64rem;
    }

    .route-heading small,
    .project-heading small {
      display: none;
    }

    .detail-card,
    .place-detail .detail-card {
      right: 1rem;
      bottom: 1rem;
      width: calc(100vw - 3.5rem);
      max-height: calc(100svh - 7rem);
      padding: 1.3rem 1.2rem 1.2rem;
      border-radius: 1.35rem;
    }

    .logic-strip {
      gap: 0.28rem;
      overflow-x: auto;
      padding-bottom: 0.15rem;
    }

    .logic-strip i {
      font-size: 0.7rem;
    }

    .play-count {
      align-items: center;
    }

    .play-count strong {
      font-size: 3.8rem;
    }

    .final-copy {
      margin-top: -2vh;
    }

    .final h2 {
      font-size: clamp(3.6rem, 16vw, 5.7rem);
    }

    .final-actions {
      flex-direction: column;
      width: min(19rem, 80vw);
      margin-inline: auto;
    }

    .final small {
      white-space: nowrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .experience-loader__mark span,
    .experience-loader__mark i,
    .experience-loader__track i {
      animation: none;
    }

    .experience-loader__track i {
      width: 100%;
      opacity: 0.5;
    }

    .about-experience {
      height: auto;
      min-height: 100vh;
    }

    .sticky-stage {
      position: relative;
      height: auto;
      min-height: 100vh;
      overflow: visible;
    }

    .scene-backdrop {
      position: sticky;
      top: 0;
      height: 100vh;
      margin-bottom: -100vh;
    }

    .chapter-layer {
      position: relative;
    }

    .chapter {
      position: relative;
      min-height: 100svh;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      filter: none !important;
    }

    .chapter-nav,
    .progress-line,
    .scroll-cue {
      display: none;
    }

    .detail-card {
      animation: none;
    }

    .scroll-cue i::after {
      animation: none;
    }
  }
</style>
