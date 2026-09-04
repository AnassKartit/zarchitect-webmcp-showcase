const json = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false, untrustedContentHint: true };
const visibleWrite = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false, untrustedContentHint: true, consequentialHint: true };

const operationSchema = {
  type: "array", minItems: 1, maxItems: 24,
  description: "A visible, reversible batch. Inspect first and preserve architecture meaning.",
  items: {
    type: "object",
    properties: {
      op: { type: "string", enum: ["set_label", "move", "style", "set_stage", "animate_edge", "add_caption", "set_duration", "clear_story"] },
      id: { type: "string", maxLength: 40 },
      label: { type: "string", maxLength: 80 },
      sub: { type: "string", maxLength: 120 },
      x: { type: "number", minimum: 0, maximum: 1100 },
      y: { type: "number", minimum: 0, maximum: 560 },
      fill: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      stroke: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      aspect: { type: "string", enum: ["16:9", "9:16"] },
      start: { type: "number", minimum: 0, maximum: 60 },
      duration: { type: "number", minimum: 0.2, maximum: 20 },
      seconds: { type: "number", minimum: 2, maximum: 60 },
      text: { type: "string", maxLength: 180 }
    },
    required: ["op"], additionalProperties: false
  }
};

export async function registerWebMcp(model, onEvent = () => {}) {
  const context = document.modelContext;
  if (!context?.registerTool) return { ready: false, tools: [] };
  let inspected = false;
  const requireInspection = () => {
    if (!inspected) throw new Error("Inspect the canvas before using a write tool.");
  };
  const register = async (definition) => {
    await context.registerTool(definition);
    onEvent({ title: "Tool registered", detail: definition.name });
  };

  await register({
    name: "zarchitect_demo_inspect_canvas",
    description: "Inspect the self-contained ZArchitect showcase canvas before making changes. Returns stable IDs, current styles, edges, story timing, and safety guidance.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: readOnly,
    execute: () => {
      inspected = true;
      onEvent({ title: "Canvas inspected", detail: "The agent read structured nodes and connections." });
      return json({
        scope: "Local showcase canvas only. This is not the ZArchitect production API.",
        workflow: ["Inspect", "Apply one focused batch", "Animate in flow order", "Review visibly", "Undo if needed"],
        safety: "Preserve technical meaning. Do not invent infrastructure. All accepted edits are local, visible, and reversible.",
        scene: model.get()
      });
    }
  });

  await register({
    name: "zarchitect_demo_apply_operations",
    description: "Apply a validated, visible, undoable batch to the local showcase diagram. Supports labels, positions, colors, stage format, edge animation, captions, and duration. Inspect first and use returned IDs.",
    inputSchema: { type: "object", properties: { operations: operationSchema }, required: ["operations"], additionalProperties: false },
    annotations: visibleWrite,
    execute: ({ operations }) => {
      requireInspection();
      const scene = model.applyOperations(operations, "agent");
      onEvent({ title: "Agent updated the canvas", detail: `${operations.length} validated operation${operations.length === 1 ? "" : "s"} applied.` });
      return json({ ok: true, message: "The batch is visible and can be reverted with zarchitect_demo_undo.", scene });
    }
  });

  await register({
    name: "zarchitect_demo_animate_story",
    description: "Create an eight-second presentation story that animates the request path from Teams to Visio, ZArchitect, AKS, and the review, with concise captions.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: visibleWrite,
    execute: () => {
      requireInspection();
      const scene = model.animate("agent");
      onEvent({ title: "Story animated", detail: "Four connections and two captions now play in sequence." });
      return json({ ok: true, message: "Animation is ready. The human can press Play or undo it.", scene });
    }
  });

  await register({
    name: "zarchitect_demo_set_format",
    description: "Reframe the local showcase as widescreen 16:9 or mobile 9:16 without changing the architecture.",
    inputSchema: { type: "object", properties: { aspect: { type: "string", enum: ["16:9", "9:16"] } }, required: ["aspect"], additionalProperties: false },
    annotations: visibleWrite,
    execute: ({ aspect }) => {
      requireInspection();
      const scene = model.applyOperations([{ op: "set_stage", aspect }], "agent");
      onEvent({ title: "Presentation reframed", detail: `Stage changed to ${aspect}.` });
      return json({ ok: true, scene });
    }
  });

  await register({
    name: "zarchitect_demo_undo",
    description: "Undo the latest local showcase edit batch.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: visibleWrite,
    execute: () => {
      requireInspection();
      const scene = model.undo("agent");
      onEvent({ title: "Agent change undone", detail: "The previous local scene state was restored." });
      return json({ ok: true, scene });
    }
  });

  return { ready: true, tools: ["inspect_canvas", "apply_operations", "animate_story", "set_format", "undo"] };
}
