import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");
const walk = (directory) => readdirSync(directory).flatMap((name) => {
  const path = join(directory, name); return statSync(path).isDirectory() ? walk(path) : [path];
});

test("registers a non-trivial browser-native WebMCP surface", () => {
  const source = read("src/webmcp.js");
  const tools = [...source.matchAll(/name: "(zarchitect_demo_[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(tools, [
    "zarchitect_demo_inspect_canvas",
    "zarchitect_demo_apply_operations",
    "zarchitect_demo_animate_story",
    "zarchitect_demo_set_format",
    "zarchitect_demo_undo"
  ]);
  assert.match(source, /document\.modelContext/);
  assert.match(source, /additionalProperties: false/);
  assert.match(source, /readOnlyHint: true/);
  assert.match(source, /consequentialHint: true/);
});

test("contains no backend calls, token plumbing, or arbitrary HTML sinks", () => {
  const files = [
    join(root, "index.html"),
    join(root, "styles.css"),
    ...walk(join(root, "src")),
    ...walk(join(root, "scripts"))
  ];
  const source = files.map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /innerHTML\s*=/);
  assert.doesNotMatch(source, /Authorization\s*:/i);
  assert.doesNotMatch(source, /(?:api[_-]?key|secret|bearer)["'\s]*[:=]["'\s]*[A-Za-z0-9_-]{20,}/i);
  assert.doesNotMatch(source, /supabase|stripe|d1database|durableobject/i);
});

test("documents the public/private boundary and an OSS license", () => {
  assert.match(read("LICENSE"), /MIT License/);
  assert.match(read("docs/PUBLIC-SCOPE.md"), /Not included/i);
  assert.match(read("README.md"), /standalone showcase/i);
});

test("includes evaluation prompts with expected tool trajectories", () => {
  const evaluations = JSON.parse(read("evals.json"));
  assert.ok(evaluations.length >= 4);
  for (const evaluation of evaluations) {
    assert.ok(evaluation.prompt);
    assert.equal(evaluation.expected_tools[0], "zarchitect_demo_inspect_canvas");
  }
});

test("validates mutations and restores the previous batch", async () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  const { createSceneModel } = await import("../src/scene.js?model-test");
  const model = createSceneModel();
  model.applyOperations([{ op: "set_label", id: "review", label: "Approved review" }], "agent");
  assert.equal(model.get().nodes.find((node) => node.id === "review").label, "Approved review");
  model.undo("human");
  assert.equal(model.get().nodes.find((node) => node.id === "review").label, "2 PM review");
  assert.throws(() => model.applyOperations([{ op: "style", id: "review", fill: "javascript:alert(1)" }], "agent"), /hex color/);
  assert.throws(() => model.applyOperations([{ op: "style", id: "review", fill: "#ffffff", html: "<script>" }], "agent"), /Unexpected field/);
  assert.throws(() => model.applyOperations([{ op: "unknown" }], "agent"), /Unsupported operation/);
});

test("rejects poisoned persisted state and restores the fixed public topology", async () => {
  const storage = new Map([
    ["zarchitect-webmcp-showcase-v1", JSON.stringify({
      stage: { aspect: "9:16" },
      duration: 999,
      nodes: [{ id: "review", label: "<img src=x onerror=alert(1)>" }],
      edges: [],
      animations: [{ id: "missing", start: -10, duration: 999 }],
      captions: [{ text: "<script>alert(1)</script>", start: 0, duration: 2 }]
    })]
  ]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  const { createSceneModel } = await import("../src/scene.js?poisoned-storage-test");
  const scene = createSceneModel().get();
  assert.equal(scene.nodes.length, 5);
  assert.equal(scene.nodes.find((node) => node.id === "review").label, "2 PM review");
  assert.equal(scene.duration, 8);
  assert.deepEqual(scene.animations, []);
  assert.deepEqual(scene.captions, []);
});

test("registers executable tools against a WebMCP-compatible page context", async () => {
  const definitions = [];
  globalThis.document = { modelContext: { registerTool: async (definition) => definitions.push(definition) } };
  const { createSceneModel } = await import("../src/scene.js?webmcp-test");
  const { registerWebMcp } = await import("../src/webmcp.js?webmcp-test");
  const model = createSceneModel();
  const result = await registerWebMcp(model);
  assert.equal(result.ready, true);
  assert.equal(definitions.length, 5);
  const inspect = definitions.find((definition) => definition.name === "zarchitect_demo_inspect_canvas");
  const update = definitions.find((definition) => definition.name === "zarchitect_demo_apply_operations");
  assert.throws(
    () => update.execute({ operations: [{ op: "set_label", id: "review", label: "Ready" }] }),
    /Inspect the canvas/
  );
  const inspected = await inspect.execute({});
  assert.match(inspected.content[0].text, /Local showcase canvas only/);
  await update.execute({ operations: [{ op: "set_label", id: "review", label: "Ready" }] });
  assert.equal(model.get().nodes.find((node) => node.id === "review").label, "Ready");
});
