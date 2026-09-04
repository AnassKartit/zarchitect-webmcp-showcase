import assert from "node:assert/strict";

const debugPort = process.env.CHROME_DEBUG_PORT || "9335";
const showcaseUrl = process.env.SHOWCASE_URL || "https://zarchitect-webmcp-demo.pages.dev/";
const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
const target = targets.find((item) => item.type === "page" && item.url === showcaseUrl);
assert.ok(target, `Open ${showcaseUrl} in the flagged Chrome instance first.`);

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handler = pending.get(message.id);
  pending.delete(message.id);
  message.error ? handler.reject(new Error(JSON.stringify(message.error))) : handler.resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result.value;
};

await call("Page.reload", { ignoreCache: true });
for (let attempt = 0; attempt < 30; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  try {
    if (await evaluate("document.readyState === 'complete' && document.querySelector('#webmcpStatus')?.dataset.ready === 'true'")) break;
  } catch {}
}

const result = await evaluate(`(async () => {
  const context = document.modelContext;
  const tools = await context.getTools();
  const byName = (name) => tools.find((tool) => tool.name === name);
  const unpack = (value) => {
    const envelope = JSON.parse(value);
    return JSON.parse(envelope.content[0].text);
  };
  let rejectedBeforeInspect = false;
  try {
    await context.executeTool(byName('zarchitect_demo_set_format'), JSON.stringify({ aspect: '9:16' }));
  } catch {
    rejectedBeforeInspect = true;
  }
  let inspection = unpack(await context.executeTool(byName('zarchitect_demo_inspect_canvas'), '{}'));
  if (inspection.scene.stage.aspect !== '16:9') {
    unpack(await context.executeTool(byName('zarchitect_demo_set_format'), JSON.stringify({ aspect: '16:9' })));
    inspection = unpack(await context.executeTool(byName('zarchitect_demo_inspect_canvas'), '{}'));
  }
  const baselineAspect = inspection.scene.stage.aspect;
  const animation = unpack(await context.executeTool(byName('zarchitect_demo_animate_story'), '{}'));
  const mobile = unpack(await context.executeTool(byName('zarchitect_demo_set_format'), JSON.stringify({ aspect: '9:16' })));
  const visibleAspect = document.querySelector('#stageFrame')?.dataset.aspect;
  const undone = unpack(await context.executeTool(byName('zarchitect_demo_undo'), '{}'));
  return {
    secureContext: window.isSecureContext,
    status: document.querySelector('#webmcpStatus')?.textContent.trim(),
    toolNames: tools.map((tool) => tool.name).sort(),
    rejectedBeforeInspect,
    nodeCount: inspection.scene.nodes.length,
    edgeCount: inspection.scene.edges.length,
    animationCount: animation.scene.animations.length,
    baselineAspect,
    visibleAspect,
    restoredAspect: undone.scene.stage.aspect,
    activityCount: document.querySelectorAll('#activityLog li').length,
    mobileResult: mobile.ok
  };
})()`);

assert.equal(result.secureContext, true);
assert.equal(result.status, "WebMCP ready");
assert.deepEqual(result.toolNames, [
  "zarchitect_demo_animate_story",
  "zarchitect_demo_apply_operations",
  "zarchitect_demo_inspect_canvas",
  "zarchitect_demo_set_format",
  "zarchitect_demo_undo"
]);
assert.equal(result.rejectedBeforeInspect, true);
assert.equal(result.nodeCount, 5);
assert.equal(result.edgeCount, 4);
assert.equal(result.animationCount, 4);
assert.equal(result.baselineAspect, "16:9");
assert.equal(result.visibleAspect, "9:16");
assert.equal(result.restoredAspect, "16:9");
assert.equal(result.mobileResult, true);
assert.ok(result.activityCount >= 4);

console.log(JSON.stringify(result, null, 2));
socket.close();
