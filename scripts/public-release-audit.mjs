import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const tracked = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root }).toString("utf8").split("\0").filter(Boolean);
const forbiddenNames = new Set(["wrangler.toml", "wrangler.json", "wrangler.jsonc", "schema.prisma"]);
const forbiddenExtensions = new Set([".map", ".pem", ".key", ".p12", ".pfx", ".sqlite", ".db", ".sql"]);
const forbiddenDirectories = /(^|\/)(migrations?|database|prisma)(\/|$)/i;
const secretPatterns = [
  /\bak_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._~-]{16,}/i,
  /\bp_[a-f0-9]{20,}\b/i,
  /api\.zarchitect\.dev/i,
  /zarchitect[^\n]{0,24}workers\.dev/i
];

assert.ok(tracked.length > 0, "No tracked public files found.");
let totalBytes = 0;
for (const relativePath of tracked) {
  assert.ok(!relativePath.startsWith(".env"), `Environment file is tracked: ${relativePath}`);
  assert.ok(!forbiddenNames.has(basename(relativePath)), `Production configuration is tracked: ${relativePath}`);
  assert.ok(!forbiddenExtensions.has(extname(relativePath)), `Sensitive artifact is tracked: ${relativePath}`);
  assert.ok(!forbiddenDirectories.test(relativePath), `Production data layer is tracked: ${relativePath}`);
  const path = join(root, relativePath);
  const bytes = statSync(path).size;
  totalBytes += bytes;
  assert.ok(bytes < 1_000_000, `Unexpectedly large tracked file: ${relativePath}`);
  const source = readFileSync(path, "utf8");
  for (const pattern of secretPatterns) assert.doesNotMatch(source, pattern, `Sensitive value found in ${relativePath}`);
}
assert.ok(totalBytes < 2_000_000, `Public repository is unexpectedly large: ${totalBytes} bytes`);
console.log(`Public release audit passed: ${tracked.length} tracked files, ${totalBytes} bytes.`);
