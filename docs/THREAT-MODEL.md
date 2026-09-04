# Threat model

This document defines the security boundary of the **standalone public showcase**. It is intentionally narrower than the ZArchitect commercial product.

## Assets protected

- Commercial editor and rendering implementation
- Remote MCP/API implementation and credentials
- Authentication, tenant, team, billing, storage, import, and export systems
- Production schemas, infrastructure configuration, telemetry, and account identifiers
- Proprietary icon ingestion and catalog data

None of those assets are required by, imported into, or represented in this repository.

## Public trust boundary

The showcase is a static browser application with one fixed five-node example. It has no application network calls, login, backend, file upload, arbitrary SVG/HTML import, or production project access. Browser state is local to the showcase origin.

The WebMCP boundary accepts a small allowlist of typed operations. A browser agent must inspect the scene before any write tool succeeds. The model independently validates operation count, operation-specific fields, stable IDs, numeric ranges, colors, text lengths, captions, animation timing, and history size. The page renders text through DOM text nodes rather than HTML sinks.

Persisted state is treated as untrusted. On load, it is reconstructed over the fixed public topology and rejected as a whole if it contains missing or duplicate nodes, unknown animation targets, unsafe colors, invalid timing, or out-of-range values.

## Expected public risks

| Risk | Control |
| --- | --- |
| Prompt injection asks a tool to exceed scope | Closed schemas, fixed IDs, bounded operations, no open-world access |
| A write happens without scene context | Write tools enforce inspect-before-write |
| Malformed local state affects rendering | Stored state is validated and rebuilt over the fixed example |
| Script or markup injection | No arbitrary HTML/SVG operations; visible strings use `textContent` |
| Data exfiltration | No application network requests; local server CSP uses `connect-src 'none'` |
| Irreversible agent action | Every batch is visible and locally undoable |
| Accidental publication of production material | Tracked-file release audit blocks secrets, project IDs, production endpoints/config, databases, source maps, and private-key artifacts |

## Copyability statement

The public showcase is open source and can be copied under its license. That is intentional and required for the challenge. Copying it yields only a small fixed local demo—not ZArchitect’s editor, importers, collaboration system, storage, render pipeline, catalog, remote MCP server, or commercial infrastructure. The security goal is separation, not obfuscation.

## Non-goals

- Protecting a user from scripts they deliberately run in their own browser profile
- Providing multi-user isolation, because the showcase has no accounts or shared backend
- Demonstrating production authentication or authorization
- Serving as a drop-in implementation of the commercial SaaS
