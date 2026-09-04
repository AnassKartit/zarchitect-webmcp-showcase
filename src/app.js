import { createSceneModel } from "./scene.js";
import { registerWebMcp } from "./webmcp.js";

const NS = "http://www.w3.org/2000/svg";
const model = createSceneModel();
const byId = (id) => document.getElementById(id);
const edgeLayer = byId("edgeLayer");
const nodeLayer = byId("nodeLayer");
const activity = byId("activityLog");
let animationFrame = 0;
let animationStarted = 0;
let currentScene;

const svg = (name, attrs = {}) => {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
};
const addText = (parent, className, x, y, value) => {
  const element = svg("text", { class: className, x, y });
  element.textContent = value;
  parent.appendChild(element);
};
const log = ({ title, detail }) => {
  const item = document.createElement("li");
  const heading = document.createElement("b"); heading.textContent = title;
  const body = document.createElement("span"); body.textContent = detail;
  item.append(heading, body); activity.prepend(item);
  while (activity.children.length > 7) activity.lastElementChild.remove();
};
const center = (node) => ({ x: node.x + node.w / 2, y: node.y + node.h / 2 });

function render(scene) {
  currentScene = scene;
  byId("sceneTitle").textContent = scene.name;
  byId("stageFrame").dataset.aspect = scene.stage.aspect;
  const mobile = scene.stage.aspect === "9:16";
  const diagram = byId("diagram");
  diagram.setAttribute("viewBox", mobile ? "0 0 675 1200" : "0 0 1200 675");
  document.querySelectorAll("[data-aspect]").forEach((button) => button.classList.toggle("selected", button.dataset.aspect === scene.stage.aspect));
  edgeLayer.replaceChildren(); nodeLayer.replaceChildren();
  const displayNodes = mobile ? scene.nodes.map((node, index) => ({
    ...node,
    x: 187.5,
    y: 55 + index * 220,
    w: 300,
    h: 155
  })) : scene.nodes;
  const nodes = new Map(displayNodes.map((node) => [node.id, node]));
  for (const edge of scene.edges) {
    const from = nodes.get(edge.from), to = nodes.get(edge.to); if (!from || !to) continue;
    const a = center(from), b = center(to), animated = scene.animations.find((item) => item.id === edge.id);
    const group = svg("g", { "data-edge-id": edge.id });
    const path = mobile
      ? `M ${a.x} ${from.y + from.h} C ${a.x} ${from.y + from.h + 30}, ${b.x} ${to.y - 30}, ${b.x} ${to.y}`
      : `M ${from.x + from.w} ${a.y} C ${from.x + from.w + 38} ${a.y}, ${to.x - 38} ${b.y}, ${to.x} ${b.y}`;
    const line = svg("path", { class: `edge-line${animated ? " is-animated" : ""}`, d: path });
    if (animated) { line.style.setProperty("--edge-delay", `${animated.start}s`); line.style.setProperty("--edge-duration", `${animated.duration}s`); }
    group.appendChild(line);
    addText(group, "edge-label", mobile ? a.x + 58 : (from.x + from.w + to.x) / 2, mobile ? (from.y + from.h + to.y) / 2 + 4 : a.y - 17, edge.label);
    edgeLayer.appendChild(group);
  }
  for (const node of displayNodes) {
    const order = scene.edges.findIndex((edge) => edge.to === node.id);
    const group = svg("g", { class: `node-group${scene.animations.length ? " is-highlighted" : ""}`, transform: `translate(${node.x} ${node.y})`, "data-node-id": node.id });
    group.style.setProperty("--node-delay", `${Math.max(0, order) * 1.4}s`);
    group.appendChild(svg("rect", { class: "node-card", width: node.w, height: node.h, rx: 20, fill: node.fill, stroke: node.stroke, "stroke-width": 3 }));
    addText(group, "node-icon", node.w / 2, node.h * .31, node.icon);
    const label = svg("text", { class: "node-label", x: node.w / 2, y: node.h * .62, fill: node.color }); label.textContent = node.label; group.appendChild(label);
    addText(group, "node-sub", node.w / 2, node.h * .79, node.sub); nodeLayer.appendChild(group);
  }
  const clips = byId("timelineClips"); clips.replaceChildren();
  const count = Math.max(1, scene.animations.length + scene.captions.length);
  for (let i = 0; i < count; i += 1) clips.appendChild(document.createElement("i"));
  byId("timelineTime").textContent = `00:00 / 00:${String(Math.round(scene.duration)).padStart(2, "0")}`;
}

function stopPlayback() {
  cancelAnimationFrame(animationFrame); animationFrame = 0;
  byId("stageFrame").classList.remove("is-playing");
  byId("stagePlay").hidden = false; byId("timelinePlay").textContent = "▶";
  byId("timelineProgress").style.width = "0%"; byId("caption").hidden = true;
}
function play() {
  stopPlayback();
  const scene = currentScene; if (!scene) return;
  animationStarted = performance.now(); byId("stageFrame").classList.add("is-playing"); byId("stagePlay").hidden = true; byId("timelinePlay").textContent = "■";
  document.querySelectorAll(".edge-line.is-animated, .node-group.is-highlighted").forEach((element) => {
    element.style.animation = "none"; void element.getBoundingClientRect(); element.style.animation = "";
  });
  const tick = (now) => {
    const elapsed = (now - animationStarted) / 1000;
    const progress = Math.min(1, elapsed / scene.duration);
    byId("timelineProgress").style.width = `${progress * 100}%`;
    byId("timelineTime").textContent = `00:${String(Math.floor(elapsed)).padStart(2, "0")} / 00:${String(Math.round(scene.duration)).padStart(2, "0")}`;
    const caption = scene.captions.find((item) => elapsed >= item.start && elapsed < item.start + item.duration);
    byId("caption").hidden = !caption; byId("caption").textContent = caption?.text || "";
    if (progress < 1) animationFrame = requestAnimationFrame(tick); else stopPlayback();
  };
  animationFrame = requestAnimationFrame(tick);
}

model.subscribe((scene, event) => {
  render(scene);
  if (event.type !== "initial") log({ title: event.source === "agent" ? "Browser agent changed the canvas" : "Human changed the canvas", detail: event.type === "operations" ? `${event.count} validated operation${event.count === 1 ? "" : "s"}.` : event.type });
});

byId("polishButton").addEventListener("click", () => model.polish());
byId("animateButton").addEventListener("click", () => { model.animate(); play(); });
byId("mobileButton").addEventListener("click", () => model.applyOperations([{ op: "set_stage", aspect: "9:16" }]));
byId("resetButton").addEventListener("click", () => model.reset());
byId("undoButton").addEventListener("click", () => model.undo());
byId("stagePlay").addEventListener("click", play);
byId("timelinePlay").addEventListener("click", () => animationFrame ? stopPlayback() : play());
document.querySelectorAll(".format-switch button").forEach((button) => button.addEventListener("click", () => model.applyOperations([{ op: "set_stage", aspect: button.dataset.aspect }])));
byId("copyPrompt").addEventListener("click", async () => {
  await navigator.clipboard.writeText(byId("starterPrompt").textContent);
  byId("copyPrompt").textContent = "Copied"; setTimeout(() => { byId("copyPrompt").textContent = "Copy prompt"; }, 1500);
});

try {
  const result = await registerWebMcp(model, log);
  byId("webmcpStatus").dataset.ready = String(result.ready);
  byId("webmcpStatus").lastElementChild.textContent = result.ready ? "WebMCP ready" : "Open in a WebMCP browser";
  log(result.ready ? { title: "WebMCP is ready", detail: `${result.tools.length} constrained page tools are available.` } : { title: "Standard browser mode", detail: "The visual demo works here; use ChatGPT in-app browser or WebMCP-enabled Chrome for agent tools." });
} catch (error) {
  byId("webmcpStatus").lastElementChild.textContent = "WebMCP unavailable";
  log({ title: "Tool registration failed", detail: error instanceof Error ? error.message : "Unknown error" });
}
