# ZArchitect WebMCP Showcase

[![Public boundary](https://github.com/AnassKartit/zarchitect-webmcp-showcase/actions/workflows/public-boundary.yml/badge.svg)](https://github.com/AnassKartit/zarchitect-webmcp-showcase/actions/workflows/public-boundary.yml)

A self-contained, local-only WebMCP collaboration demo: a human states the outcome, a browser agent inspects a structured architecture canvas, and the canvas updates visibly while the human can review or undo every change.

**Live public demo:** <https://zarchitect-webmcp-demo.pages.dev/>

**Narrated demo video:** <https://github.com/AnassKartit/zarchitect-webmcp-showcase/releases/download/demo-v1/zarchitect-webmcp-demo.mp4>

This is a **standalone showcase**, not the source code for the ZArchitect SaaS. The commercial editor, backend, remote MCP server, authentication, storage, importers, icon catalogs, billing, and rendering infrastructure are deliberately excluded. See [Public showcase scope](docs/PUBLIC-SCOPE.md).

Security and reproducibility are documented in the [threat model](docs/THREAT-MODEL.md), [security policy](SECURITY.md), and [verification evidence](docs/VERIFICATION.md).

## Why WebMCP fits

Architecture editing combines human intent with precise structured operations. A person can say “make this executive-ready and animate the request flow”; the agent can inspect stable node and edge IDs, apply validated operations, and show the result in the same live canvas. That is faster and more reliable than guessing UI coordinates, while remaining easy for the person to supervise.

## What people and agents do together

- The human chooses intent, format, and acceptable semantic changes.
- The agent inspects the actual scene instead of inferring it from pixels.
- The agent applies bounded style, layout, caption, timing, and animation operations.
- The human watches each result, plays the story, changes format, or undoes the batch.

## WebMCP implementation

The page registers five tools with `document.modelContext.registerTool()`:

| Tool | Purpose |
| --- | --- |
| `zarchitect_demo_inspect_canvas` | Read the compact scene, stable IDs, workflow, and safety guidance. |
| `zarchitect_demo_apply_operations` | Apply a validated, visible, undoable operation batch. |
| `zarchitect_demo_animate_story` | Build the example’s ordered eight-second story. |
| `zarchitect_demo_set_format` | Reframe the same canvas as 16:9 or 9:16. |
| `zarchitect_demo_undo` | Restore the previous local scene state. |

Tool annotations distinguish read-only inspection from consequential visible writes. Schemas reject unknown fields, operations are allowlisted and bounded, no arbitrary HTML/SVG/URL execution is accepted, and all edits share the same scene model as the human controls.

Write tools also enforce inspect-before-write, and persisted browser state is treated as untrusted. See the [threat model](docs/THREAT-MODEL.md).

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm run dev
```

Open <http://127.0.0.1:4173>. The visual demo works in any modern browser. For agent tool use, open the deployed version in ChatGPT’s in-app browser or Chrome with WebMCP testing enabled.

No dependency installation, account, token, backend, or paid service is required.

For a production static upload, build the explicit public asset allowlist instead of uploading the repository root:

```bash
npm run build:static
```

Deploy only the generated `dist/` directory.

## Test

```bash
npm run check
```

The checks validate JavaScript syntax, exact registered tool names, required WebMCP annotations, the public/private boundary, evaluation trajectories, poisoned persisted state, inspect-before-write enforcement, and the absence of backend calls, credential plumbing, unsafe HTML sinks, production configuration, source maps, private keys, and production identifiers.

## Suggested agent test

> Inspect this architecture, polish it for an executive review, animate the request flow, and make it mobile-friendly. Preserve the technical meaning.

Expected behavior: the agent calls `zarchitect_demo_inspect_canvas` before write tools, uses a focused operation batch or the story tool, switches to 9:16, and summarizes visible changes. The human can press Play and Undo.

## What is new for the WebMCP work

The browser-native tool surface, constrained operation schemas, shared human/agent scene model, visible activity log, reversible edit loop, mobile presentation control, and WebMCP evaluation cases are the WebMCP-specific extension demonstrated by this repository.

## License

MIT. The showcase uses only original generic symbols and system fonts; it contains no third-party vendor icon packs.
