#!/usr/bin/env node
/**
 * Installs every component in the registry into a throwaway project and
 * compiles them. Catches the failure mode the shadcn CLI makes possible: it
 * strips version specifiers and always installs `latest`, so a major release
 * of Radix, Lucide or anything else can break every new install while this
 * repo — which has a lockfile — keeps building fine.
 *
 *   node scripts/verify-registry.mjs [registryDir]
 *
 * Defaults to ./r, falling back to ./public/r. Exits non-zero on any failure.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REGISTRY = resolve(
  process.argv[2] ?? (existsSync("r") ? "r" : "public/r")
);
const dir = mkdtempSync(join(tmpdir(), "registry-verify-"));
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: dir, stdio: "pipe", encoding: "utf8", ...opts });

const items = readdirSync(REGISTRY)
  .filter((f) => f.endsWith(".json") && f !== "theme.json" && !f.startsWith("lib-"));

console.log(`verifying ${items.length} components from ${REGISTRY}`);

try {
  // A minimal project the shadcn CLI recognises.
  writeFileSync(join(dir, "package.json"), JSON.stringify({
    name: "registry-verify", private: true, type: "module",
    dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    devDependencies: { typescript: "^5.9.2", "@types/react": "^19.1.0", "@types/react-dom": "^19.1.0" },
  }, null, 2));
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2022", lib: ["DOM", "DOM.Iterable", "ES2022"],
      module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx",
      strict: true, noEmit: true, skipLibCheck: true,
      paths: { "@/*": ["./src/*"] },
    },
    include: ["src"],
  }, null, 2));
  writeFileSync(join(dir, "components.json"), JSON.stringify({
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york", rsc: false, tsx: true,
    tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true, prefix: "" },
    iconLibrary: "lucide",
    aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
  }, null, 2));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src/index.css"), '@import "tailwindcss";\n');

  console.log("installing base deps…");
  run("npm", ["install", "--silent", "--no-audit", "--no-fund"]);

  // Batches of six — the CLI rejects very long argument lists.
  for (let i = 0; i < items.length; i += 6) {
    const batch = items.slice(i, i + 6).map((f) => join(REGISTRY, f));
    process.stdout.write(`  ${Math.min(i + 6, items.length)}/${items.length}\r`);
    run("npx", ["--yes", "shadcn@latest", "add", ...batch, "--yes"]);
  }
  console.log(`  ${items.length}/${items.length} installed`);

  const uiDir = join(dir, "src/components/ui");
  const files = readdirSync(uiDir).filter((f) => /\.tsx?$/.test(f));
  if (files.length < items.length) {
    throw new Error(`only ${files.length} of ${items.length} components landed`);
  }

  // Import every module so tsc compiles all of them, not just what a page uses.
  writeFileSync(
    join(dir, "src/all.ts"),
    files
      .map((f) => `import "@/components/ui/${f.replace(/\.tsx?$/, "")}";`)
      .join("\n") + "\n"
  );

  console.log("typechecking…");
  run("npx", ["--yes", "tsc", "--noEmit"]);
  console.log(`\nOK — ${files.length} components installed and compiled`);
} catch (error) {
  const detail = (error.stdout || "") + (error.stderr || "") || error.message;
  console.error("\nFAILED\n");
  console.error(detail.split("\n").slice(0, 40).join("\n"));
  console.error(
    "\nMost likely cause: a dependency published a new major version. The shadcn\n" +
    "CLI ignores version ranges and installs `latest`, so new installs break\n" +
    "while this repo keeps building against its lockfile."
  );
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
