import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const output = join(root, "dist");
const assets = [
  "_headers",
  "404.html",
  "index.html",
  "styles.css",
  "src/app.js",
  "src/scene.js",
  "src/webmcp.js",
  "docs/PUBLIC-SCOPE.md",
  "docs/THREAT-MODEL.md"
];

rmSync(output, { recursive: true, force: true });
for (const asset of assets) {
  const destination = join(output, asset);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(join(root, asset), destination);
}
console.log(`Static build created with ${assets.length} allowlisted assets.`);
