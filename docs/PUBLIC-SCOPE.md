# Public showcase scope

This repository is intentionally a **standalone showcase**, not the source code for the ZArchitect SaaS.

It is complete for what it claims to be: a static, local-only architecture canvas demonstrating browser-native WebMCP collaboration. A person can edit it with the visible controls, and a compatible browser agent can inspect the same scene, make constrained changes, animate the flow, switch presentation format, and undo changes.

## Included

- A small SVG scene renderer written specifically for this showcase
- A fixed example architecture with original, generic symbols
- Five browser-native WebMCP tools
- Validation, operation limits, visible updates, local undo, and localStorage persistence
- Evaluation prompts and expected tool trajectories
- A zero-dependency local server with restrictive response headers

## Not included

- ZArchitect’s production editor or its source maps
- The remote MCP server or API implementation
- Authentication, organizations, teams, roles, billing, or entitlements
- Database schemas, migrations, synchronization, audit logs, or storage code
- Visio/draw.io importers or document parsers
- Vendor icon packs, icon ingestion, proprietary catalogs, or uploaded assets
- Video/GIF/PDF/PPTX rendering workers or export infrastructure
- Production deployment configuration, account identifiers, observability configuration, or credentials

## Why this is honest

The live artifact and this repository describe the same standalone showcase. They do not claim that this code can reproduce the commercial product. The showcase demonstrates the user-facing WebMCP interaction pattern while preserving ZArchitect’s commercial implementation boundary.

## Security properties

- No network requests are made by application code.
- Tool calls accept only an allowlist of operations and properties.
- String, number, color, collection, and history sizes are bounded.
- User and agent text is rendered with `textContent`, never as HTML.
- The showcase accepts no arbitrary SVG, scripts, URLs, or file uploads.
- Every mutation is visible on the open canvas and is locally reversible.
- Browser agents must inspect the scene before a write tool succeeds.
- Persisted browser state is validated and rebuilt over the fixed public topology before rendering.
- Local serving uses a restrictive Content Security Policy and related headers.
- A tracked-file release audit rejects secret-shaped values and production-only artifacts before publication.

For the complete trust-boundary analysis, see [Threat model](THREAT-MODEL.md).
