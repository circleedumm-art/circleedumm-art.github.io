import { readFileSync, readdirSync } from "node:fs";
import { ESLint } from "eslint";
import * as espree from "espree";
import globals from "globals";

const read = f => readFileSync(f, "utf8");

function collect(p, out) {
  if (!p) return;
  if (p.type === "Identifier") out.add(p.name);
  else if (p.type === "ObjectPattern") p.properties.forEach(x => collect(x.value || x.argument, out));
  else if (p.type === "ArrayPattern") p.elements.forEach(x => collect(x, out));
  else if (p.type === "AssignmentPattern") collect(p.left, out);
  else if (p.type === "RestElement") collect(p.argument, out);
}
function topLevelNames(code) {
  const out = new Set();
  for (const n of espree.parse(code, { ecmaVersion: "latest", sourceType: "script" }).body) {
    if (n.type === "VariableDeclaration") n.declarations.forEach(d => collect(d.id, out));
    else if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id) out.add(n.id.name);
  }
  return out;
}

const problems = new Map();
async function lint(file, allowed) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{ files: ["**/*.js"], languageOptions: { ecmaVersion: "latest", sourceType: "script", globals: allowed }, rules: { "no-undef": "error" } }]
  });
  const [res] = await eslint.lintText(read(file), { filePath: file });
  for (const m of res.messages) problems.set(`${file}:${m.line}:${m.column} ${m.message}`, 1);
}

const base = { ...globals.browser, firebase: "readonly" };
for (const page of readdirSync(".").filter(f => f.endsWith(".html"))) {
  const srcs = [...read(page).matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s));
  const names = Object.fromEntries(srcs.map(s => [s, topLevelNames(read(s))]));
  for (const s of srcs) {
    const allowed = { ...base };
    for (const [other, set] of Object.entries(names)) if (other !== s) set.forEach(n => (allowed[n] = "readonly"));
    await lint(s, allowed);
  }
}
await lint("sw.js", globals.serviceworker);

if (problems.size) { console.error([...problems.keys()].join("\n")); process.exit(1); }
console.log("lint: no undefined variables found");
