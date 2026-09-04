# Verification evidence

This page maps the standalone showcase’s public claims to reproducible evidence. It does not claim that a Devpost entry was accepted or submitted.

## Functional evidence

| Claim | Evidence |
| --- | --- |
| The page exposes a non-trivial WebMCP surface | `src/webmcp.js` registers five tools with `document.modelContext.registerTool()` |
| Human and agent actions share one canvas model | `src/app.js` and every tool operate on the model from `src/scene.js` |
| Agent writes are constrained | Closed JSON schemas, operation-specific field allowlists, stable IDs, bounded values, and inspect-before-write enforcement |
| Changes are visible and reversible | The activity log, animation timeline, format controls, and local Undo all use the same model history |
| The demo works without paid infrastructure | It is a static site with no dependency installation and no application network calls |
| The architecture survives mobile reframing | The same five nodes and four edges render in both 16:9 and 9:16 |

## Public/private boundary evidence

- The [public scope](PUBLIC-SCOPE.md) lists every commercial subsystem intentionally excluded.
- The [threat model](THREAT-MODEL.md) explains the trust boundary and why copying this repository cannot reproduce the SaaS.
- `npm run audit:public` rejects credential-shaped values, production endpoints and project IDs, production configuration, database artifacts, source maps, private keys, and unexpectedly large files.
- `npm run build:static` produces an explicit nine-file deployment allowlist.
- The public origin returns `404` for repository metadata, build scripts, tests, package metadata, and local Devpost state.

## Reproduce locally

```bash
npm run check
npm run build:static
npm run dev
```

Then open <http://127.0.0.1:4173>, press **Animate flow**, switch to **Mobile 9:16**, and press **Undo**.

For page-defined tool testing, use ChatGPT’s in-app browser or a WebMCP-enabled Chrome build. A normal browser still supports all visible human controls but reports that the WebMCP client surface is unavailable.

## Demo assets

- [Live public demo](https://zarchitect-webmcp-demo.pages.dev/)
- [36-second narrated MP4](https://github.com/AnassKartit/zarchitect-webmcp-showcase/releases/download/demo-v1/zarchitect-webmcp-demo.mp4)
- The video soundtrack contains narration only—no music, underscore, or UI effects.
