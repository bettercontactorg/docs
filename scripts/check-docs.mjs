// Structural checks that Mintlify does not run for us.
// - every page in mint.json exists on disk
// - every page on disk is reachable from the navigation
// - every internal link points at a page that exists
// - every anchor into taxonomies.mdx matches a real heading
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry.startsWith(".")) return [];
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const mdx = walk(".").filter((f) => f.endsWith(".mdx")).map((f) => relative(".", f));
const pages = new Set(mdx.map((f) => "/" + f.replace(/\.mdx$/, "")));
const errors = [];

const nav = JSON.parse(readFileSync("mint.json", "utf8")).navigation.flatMap((g) => g.pages);
for (const page of nav) {
  if (!pages.has("/" + page)) errors.push(`mint.json points at a page that does not exist: ${page}`);
}
for (const page of pages) {
  if (!nav.includes(page.slice(1))) errors.push(`page is not in the navigation: ${page}`);
}

const corpus = [...mdx, "api-reference/openapi.json"]
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

for (const [, link] of corpus.matchAll(/\]\((\/[^)#\s]*)(?:#[^)\s]*)?\)/g)) {
  if (!pages.has(link)) errors.push(`broken internal link: ${link}`);
}

const taxonomies = readFileSync("api-reference/taxonomies.mdx", "utf8");
const headings = new Set(
  [...taxonomies.matchAll(/^## (.+)$/gm)].map(([, h]) =>
    h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  )
);
for (const [, anchor] of corpus.matchAll(/\]\(\/api-reference\/taxonomies#([^)\s]+)\)/g)) {
  if (!headings.has(anchor)) errors.push(`broken taxonomies anchor: #${anchor}`);
}

if (errors.length) {
  console.error("Docs checks failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Docs checks passed: ${mdx.length} pages, navigation and links consistent.`);
