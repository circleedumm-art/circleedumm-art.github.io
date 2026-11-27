import { readFileSync } from "node:fs";
import * as espree from "espree";

const keyName = p => p.key.name ?? p.key.value;
function table(file, varName) {
  const ast = espree.parse(readFileSync(file, "utf8"), { ecmaVersion: "latest", sourceType: "script" });
  const d = ast.body.filter(n => n.type === "VariableDeclaration").flatMap(n => n.declarations).find(x => x.id.name === varName);
  if (!d || d.init?.type !== "ObjectExpression") throw new Error(`${varName} not found in ${file}`);
  const lang = l => d.init.properties.find(p => keyName(p) === l).value.properties.map(keyName);
  return { en: new Set(lang("en")), my: new Set(lang("my")) };
}

let bad = 0;
for (const [file, name] of [["app.js", "T"], ["common.js", "COMMON_T"]]) {
  const { en, my } = table(file, name);
  for (const k of en) if (!my.has(k)) { console.error(`${file} ${name}: "${k}" is missing in Burmese (my)`); bad++; }
  for (const k of my) if (!en.has(k)) { console.error(`${file} ${name}: "${k}" is missing in English (en)`); bad++; }
}
if (bad) process.exit(1);
console.log("i18n: English and Burmese keys match");
