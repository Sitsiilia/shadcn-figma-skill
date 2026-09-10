#!/usr/bin/env node
/**
 * Look up how something is built in the library.
 *
 *   node find.mjs modal              best-matching recipe, in full
 *   node find.mjs modal --all        every match
 *   node find.mjs --page Dialog      every recipe on one component page
 *   node find.mjs --recipe Dialog "Sticky Footer"    one recipe's full anatomy
 *   node find.mjs --api Button       the REAL code API (props, values, import)
 *   node find.mjs --parts Bubble     the parts a component is composed from
 *   node find.mjs --list             every component page and its recipe names
 *
 * Everything is read from data/ — no Figma access, no network.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const recipes = JSON.parse(readFileSync(join(DATA, "recipes.json"), "utf8"));
const api = JSON.parse(readFileSync(join(DATA, "component-api.json"), "utf8"));
const codeApi = JSON.parse(readFileSync(join(DATA, "code-api.json"), "utf8"));
const pageToFile = JSON.parse(readFileSync(join(DATA, "page-to-file.json"), "utf8"));
const figmaLinks = JSON.parse(readFileSync(join(DATA, "figma-links.json"), "utf8"));

/**
 * Where to see this component in Figma. With no reachable file key the link is
 * the Community file, so the page name carries the "where" — hence the label.
 */
function figmaLink(page) {
  const entry = figmaLinks.pages?.[page];
  if (!entry) return null;
  return entry.exact ? entry.url : `"${page}" page — ${entry.url}`;
}

/** The import line + props for whichever files back a Figma page. */
function printCodeApi(page) {
  for (const file of pageToFile[page] ?? []) {
    const entry = codeApi[file];
    if (!entry) continue;
    console.log(`import { ${entry.parts.join(", ")} } from "${entry.import}";`);
    for (const [name, d] of Object.entries(entry.components)) {
      if (!d.props.length) continue;
      const vals = Object.entries(d.values)
        .map(([prop, v]) => `${prop}=${v.join("|")}${d.defaults[prop] ? ` (default ${d.defaults[prop]})` : ""}`)
        .join("   ");
      console.log(`  ${name}: ${vals || d.props.join(", ")}`);
    }
  }
}

/** Words a user is likely to say -> the page that actually holds it. */
const SYNONYMS = {
  modal: "Dialog", "modal dialog": "Dialog", overlay: "Dialog", lightbox: "Dialog",
  confirm: "Alert Dialog", confirmation: "Alert Dialog", "are you sure": "Alert Dialog",
  "side panel": "Sheet", sidepanel: "Sheet", offcanvas: "Sheet", panel: "Sheet",
  "bottom sheet": "Drawer", toast: "Toast", notification: "Toast", snackbar: "Toast",
  dropdown: "Dropdown Menu", menu: "Dropdown Menu", "right click": "Contex Menu",
  autocomplete: "Combobox", typeahead: "Combobox", search: "Command", palette: "Command",
  "command palette": "Command", chat: "Bubble", message: "Message", conversation: "Message Scroller",
  upload: "Attachment", file: "Attachment", attachment: "Attachment",
  form: "Field", label: "Label", validation: "Field", error: "Field",
  toggle: "Switch", checkbox: "Checkbox", radio: "Radio Group", "otp": "Input OPT",
  "pin": "Input OPT", "one time": "Input OPT", nav: "Navigation Menu",
  breadcrumbs: "Breadcrumb", pagination: "Pagination", tabs: "Tabs",
  loading: "Spinner", spinner: "Spinner", skeleton: "Skeleton", placeholder: "Empty",
  "empty state": "Empty", avatar: "Avatar", chip: "Badge", tag: "Badge", pill: "Badge",
  tooltip: "Tooltip", popover: "Popover", accordion: "Accordion", collapse: "Collapsible",
  survey: "Questionnaire", quiz: "Questionnaire", poll: "Questionnaire",
  datepicker: "Date Picker", calendar: "Calendar", table: "Table", grid: "Data Table",
  sidebar: "Sidebar", nav_rail: "Sidebar", card: "Card", list: "Item", "list item": "Item",
  slider: "Slider", range: "Slider", progress: "Progress", separator: "Seperator",
  divider: "Seperator", keyboard: "Kbd", shortcut: "Kbd", marker: "Marker", pin_map: "Marker",
};

/** Every part name the library actually exports, normalised for comparison. */
const KNOWN_PARTS = new Set(
  Object.values(codeApi)
    .flatMap((e) => e.parts)
    .map((p) => p.toLowerCase())
);
const normalise = (name) => name.replace(/[\s_-]/g, "").toLowerCase();

/**
 * Some pages lay their examples out as galleries whose roots are Figma frames
 * ("Extra small", "Wrapper"). Those trees describe the page, not a composition,
 * so they are dropped rather than shown as if they were components.
 */
function isComposition(roots) {
  const named = roots.filter((r) => r && r.type !== "TEXT");
  if (!named.length) return false;
  return named.some((r) => KNOWN_PARTS.has(normalise(r.name)));
}

function renderAnatomy(node, depth = 0) {
  const pad = "  ".repeat(depth);
  if (node.type === "TEXT") return node.text ? `${pad}"${node.text}"` : null;
  const kids = (node.children ?? []).map((c) => renderAnatomy(c, depth + 1)).filter(Boolean);
  return kids.length ? `${pad}<${node.name}>\n${kids.join("\n")}` : `${pad}<${node.name} />`;
}

function printRecipe(page, r, withAnatomy = true) {
  console.log(`\n### ${page} — ${r.name}`);
  if (r.description) console.log(`${r.description.replace(/\s+/g, " ")}`);
  if (withAnatomy && r.anatomy?.length && isComposition(r.anatomy)) {
    console.log("\nAnatomy as built in Figma:");
    for (const a of r.anatomy) {
      if (!KNOWN_PARTS.has(normalise(a.name))) continue;
      const s = renderAnatomy(a);
      if (s) console.log(s);
    }
  }
}

const argv = process.argv.slice(2);
const allIndex = argv.indexOf("--all");
const showAll = allIndex !== -1;
if (showAll) argv.splice(allIndex, 1);
const flag = argv[0]?.startsWith("--") ? argv.shift() : null;
const query = argv.join(" ").trim();

if (flag === "--list" || (!flag && !query)) {
  for (const [page, recs] of Object.entries(recipes)) {
    console.log(`${page.padEnd(24)} ${recs.map((r) => r.name).join(" | ")}`);
  }
  process.exit(0);
}

if (flag === "--page") {
  const page = Object.keys(recipes).find((p) => p.toLowerCase() === query.toLowerCase());
  if (!page) {
    console.error(`No page "${query}". Try --list.`);
    process.exit(1);
  }
  console.log(`# ${page} — ${recipes[page].length} recipes`);
  const pageLink = figmaLink(page);
  if (pageLink) console.log(`Figma: ${pageLink}`);
  for (const r of recipes[page]) printRecipe(page, r);
  process.exit(0);
}

if (flag === "--recipe") {
  const [pageArg, ...rest] = argv;
  const name = rest.join(" ");
  const page = Object.keys(recipes).find((p) => p.toLowerCase() === pageArg.toLowerCase());
  const r = recipes[page]?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!r) {
    console.error(`No recipe "${name}" on "${pageArg}".`);
    process.exit(1);
  }
  printRecipe(page, r);
  const recipeLink = figmaLink(page);
  if (recipeLink) console.log(`\nFigma: ${recipeLink}`);
  process.exit(0);
}

if (flag === "--api" || flag === "--parts") {
  const q2 = query.toLowerCase().replace(/[\s-]/g, "");
  const hits = Object.entries(codeApi).filter(
    ([file, entry]) =>
      file.replace(/-/g, "").includes(q2) ||
      entry.parts.some((p) => p.toLowerCase() === q2 || p.toLowerCase().startsWith(q2))
  );
  if (hits.length) {
    for (const [file, entry] of hits) {
      const withProps = Object.entries(entry.components).filter(([, d]) => d.props.length);
      console.log(`\n## ${file}\nimport { ${entry.parts.join(", ")} } from "${entry.import}";`);
      if (!withProps.length) {
        console.log("  (no variant props — composition only)");
        continue;
      }
      for (const [name, d] of withProps) {
        console.log(`\n  ${name}  —  ${d.props.join(", ")}`);
        for (const [prop, values] of Object.entries(d.values)) {
          const def = d.defaults[prop] ? `   (default: ${d.defaults[prop]})` : "";
          console.log(`      ${prop}: ${values.join(" | ")}${def}`);
        }
      }
    }
    console.log(
      `\nThese are the code props. The Figma variant axes differ — State, Dir and\n` +
        `Position are not props, and Roudness is \`className="rounded-full"\`.\n` +
        `Use --figma ${query} to see the design-side axes.`
    );
    process.exit(0);
  }
  console.error(`No component matching "${query}". Try --list.`);
  process.exit(1);
}

if (flag === "--figma") {
  const hits = Object.entries(api.sets).filter(
    ([name, meta]) =>
      name.toLowerCase().includes(query.toLowerCase()) ||
      (meta.page ?? "").toLowerCase().includes(query.toLowerCase())
  );
  if (!hits.length) {
    console.error(`No component set matching "${query}".`);
    process.exit(1);
  }
  for (const [name, meta] of hits) {
    console.log(`\n## ${name}   (page: ${meta.page}, ${meta.count} Figma variants)`);
    for (const [prop, values] of Object.entries(meta.props)) {
      console.log(`   ${prop.padEnd(16)} ${values.join(" | ")}`);
    }
  }
  process.exit(0);
}

// Default: keyword search across page names, recipe names and descriptions.
// Prints ONE best match in full plus the sibling recipe names — enough to
// answer with, without flooding the context. Pass --all for every match.
const q = query.toLowerCase();
// Multi-word queries ("chat bubble", "file upload"): try the whole phrase,
// then each word, so a user's natural phrasing still lands on a page.
const words = q.split(/\s+/).filter(Boolean);
const target =
  SYNONYMS[q] ?? words.map((w) => SYNONYMS[w]).find(Boolean) ?? undefined;
const terms = [q, ...words];
const results = [];
for (const [page, recs] of Object.entries(recipes)) {
  const pageHit = page.toLowerCase().includes(q) || page === target;
  for (const r of recs) {
    const hit =
      pageHit ||
      terms.some((t) => r.name.toLowerCase().includes(t)) ||
      (r.description ?? "").toLowerCase().includes(q);
    if (!hit) continue;
    // Prefer the plainest recipe as the representative one.
    const plain = /^(basic|default|variants?|sizes?)$/i.test(r.name) ? 1 : 0;
    results.push([page, r, (pageHit ? 2 : 1) + plain]);
  }
}
if (!results.length) {
  console.error(`Nothing matched "${query}".`);
  console.error(`Try: node find.mjs --list   (every component and recipe)`);
  process.exit(1);
}
results.sort((a, b) => b[2] - a[2]);

if (showAll) {
  for (const [page, r] of results) printRecipe(page, r);
  process.exit(0);
}

const [page, best] = results[0];
const siblings = (recipes[page] ?? []).filter((r) => r.name !== best.name).map((r) => r.name);
console.log(`${page}\n`);
printCodeApi(page);
const link = figmaLink(page);
if (link) console.log(`\nFigma: ${link}`);
console.log(`\nBest-matching recipe of ${recipes[page].length}:`);
printRecipe(page, best);
if (siblings.length) {
  console.log(`\nOther ${page} recipes: ${siblings.join(" · ")}`);
  console.log(`  node find.mjs --recipe "${page}" "<name>"    node find.mjs --page "${page}"`);
}
