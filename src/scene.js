const STORAGE_KEY = "zarchitect-webmcp-showcase-v1";
const HEX = /^#[0-9a-f]{6}$/i;
const MAX_HISTORY = 30;

export const DEFAULT_SCENE = Object.freeze({
  name: "AKS release flow",
  stage: { aspect: "16:9" },
  duration: 8,
  nodes: [
    { id: "teams", label: "Teams request", sub: "Architecture review", icon: "💬", x: 70, y: 260, w: 180, h: 120, fill: "#eef4ff", stroke: "#8cace9", color: "#10203a" },
    { id: "visio", label: "Visio file", sub: "Current design", icon: "▧", x: 300, y: 260, w: 180, h: 120, fill: "#f2efff", stroke: "#a999ec", color: "#10203a" },
    { id: "zarchitect", label: "ZArchitect", sub: "Polish + animate", icon: "Z", x: 530, y: 235, w: 200, h: 170, fill: "#eaf2ff", stroke: "#2f6fed", color: "#10203a" },
    { id: "aks", label: "AKS platform", sub: "Release topology", icon: "⬡", x: 780, y: 260, w: 180, h: 120, fill: "#ebfaf4", stroke: "#53b98b", color: "#10203a" },
    { id: "review", label: "2 PM review", sub: "Ready to present", icon: "▶", x: 1010, y: 260, w: 150, h: 120, fill: "#fff4e8", stroke: "#efa45f", color: "#10203a" }
  ],
  edges: [
    { id: "request", from: "teams", to: "visio", label: "share" },
    { id: "import", from: "visio", to: "zarchitect", label: "import" },
    { id: "transform", from: "zarchitect", to: "aks", label: "explain" },
    { id: "present", from: "aks", to: "review", label: "present" }
  ],
  animations: [],
  captions: []
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const finite = (value, min, max, name) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return number;
};
const text = (value, max, name) => {
  if (typeof value !== "string") throw new Error(`${name} must be text.`);
  const clean = value.replace(/[\u0000-\u001f]/g, " ").trim();
  if (!clean || clean.length > max) throw new Error(`${name} must contain 1–${max} characters.`);
  return clean;
};
const color = (value, name) => {
  const clean = typeof value === "string" ? value.trim() : "";
  if (!HEX.test(clean)) throw new Error(`${name} must be a six-digit hex color.`);
  return clean;
};

function normalize(scene) {
  if (!scene || !Array.isArray(scene.nodes) || !Array.isArray(scene.edges)) return clone(DEFAULT_SCENE);
  return scene;
}

export function createSceneModel() {
  let scene;
  try { scene = normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { scene = clone(DEFAULT_SCENE); }
  const history = [];
  const listeners = new Set();
  const notify = (event) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
    for (const listener of listeners) listener(clone(scene), event);
  };
  const snapshot = () => {
    history.push(clone(scene));
    if (history.length > MAX_HISTORY) history.shift();
  };
  const node = (id) => {
    const found = scene.nodes.find((item) => item.id === id);
    if (!found) throw new Error(`Unknown node id: ${id}`);
    return found;
  };
  const edge = (id) => {
    const found = scene.edges.find((item) => item.id === id);
    if (!found) throw new Error(`Unknown edge id: ${id}`);
    return found;
  };

  const applyOperations = (operations, source = "human") => {
    if (!Array.isArray(operations) || operations.length < 1 || operations.length > 24) throw new Error("Provide 1–24 operations.");
    snapshot();
    try {
      for (const raw of operations) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Each operation must be an object.");
        const op = String(raw.op || "");
        if (op === "set_label") {
          const target = node(text(raw.id, 40, "id"));
          target.label = text(raw.label, 80, "label");
          if (raw.sub != null) target.sub = text(raw.sub, 120, "sub");
        } else if (op === "move") {
          const target = node(text(raw.id, 40, "id"));
          target.x = finite(raw.x, 0, 1100, "x"); target.y = finite(raw.y, 0, 560, "y");
        } else if (op === "style") {
          const target = node(text(raw.id, 40, "id"));
          if (raw.fill != null) target.fill = color(raw.fill, "fill");
          if (raw.stroke != null) target.stroke = color(raw.stroke, "stroke");
          if (raw.color != null) target.color = color(raw.color, "color");
        } else if (op === "set_stage") {
          if (!['16:9', '9:16'].includes(raw.aspect)) throw new Error("aspect must be 16:9 or 9:16.");
          scene.stage.aspect = raw.aspect;
        } else if (op === "animate_edge") {
          const target = edge(text(raw.id, 40, "id"));
          scene.animations = scene.animations.filter((item) => item.id !== target.id);
          scene.animations.push({ id: target.id, start: finite(raw.start ?? 0, 0, 60, "start"), duration: finite(raw.duration ?? 1.5, .2, 10, "duration") });
        } else if (op === "add_caption") {
          scene.captions.push({ id: `caption-${Date.now()}-${scene.captions.length}`, text: text(raw.text, 180, "caption"), start: finite(raw.start ?? 0, 0, 60, "start"), duration: finite(raw.duration ?? 2.5, .5, 20, "duration") });
          if (scene.captions.length > 12) scene.captions = scene.captions.slice(-12);
        } else if (op === "set_duration") {
          scene.duration = finite(raw.seconds, 2, 60, "seconds");
        } else if (op === "clear_story") {
          scene.animations = []; scene.captions = [];
        } else {
          throw new Error(`Unsupported operation: ${op || "missing"}`);
        }
      }
    } catch (error) {
      scene = history.pop() || scene;
      throw error;
    }
    notify({ type: "operations", source, count: operations.length });
    return clone(scene);
  };

  return {
    get: () => clone(scene),
    subscribe(listener) { listeners.add(listener); listener(clone(scene), { type: "initial", source: "system" }); return () => listeners.delete(listener); },
    applyOperations,
    polish(source = "human") {
      return applyOperations([
        { op: "style", id: "teams", fill: "#eef4ff", stroke: "#5c8ce5" },
        { op: "style", id: "visio", fill: "#f2efff", stroke: "#886fe0" },
        { op: "style", id: "zarchitect", fill: "#e5efff", stroke: "#2f6fed" },
        { op: "style", id: "aks", fill: "#e8f9f1", stroke: "#2fa977" },
        { op: "style", id: "review", fill: "#fff1e3", stroke: "#e88232" }
      ], source);
    },
    animate(source = "human") {
      return applyOperations([
        { op: "clear_story" }, { op: "set_duration", seconds: 8 },
        { op: "animate_edge", id: "request", start: .6, duration: 1.2 },
        { op: "animate_edge", id: "import", start: 2, duration: 1.2 },
        { op: "animate_edge", id: "transform", start: 3.4, duration: 1.2 },
        { op: "animate_edge", id: "present", start: 4.8, duration: 1.2 },
        { op: "add_caption", text: "From a Teams request to a presentation-ready AKS story.", start: .4, duration: 2.6 },
        { op: "add_caption", text: "The agent transforms the canvas while the human stays in control.", start: 3.2, duration: 3.5 }
      ], source);
    },
    undo(source = "human") {
      if (!history.length) return clone(scene);
      scene = history.pop(); notify({ type: "undo", source }); return clone(scene);
    },
    reset(source = "human") {
      snapshot(); scene = clone(DEFAULT_SCENE); notify({ type: "reset", source }); return clone(scene);
    }
  };
}
