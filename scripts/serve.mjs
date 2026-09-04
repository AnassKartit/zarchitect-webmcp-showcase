import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8" };

createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname); }
  catch { response.writeHead(400); response.end("Bad request"); return; }
  let file = resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
  const fromRoot = relative(root, file);
  if (fromRoot.startsWith("..") || fromRoot.includes("../") || fromRoot.includes("..\\")) { response.writeHead(403); response.end("Forbidden"); return; }
  try { if (statSync(file).isDirectory()) file = join(file, "index.html"); }
  catch { response.writeHead(404); response.end("Not found"); return; }
  response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`ZArchitect WebMCP showcase: http://127.0.0.1:${port}`));
