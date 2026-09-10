# figma-shadcn-by-sitsiilia

A Claude skill for building UI with the **[shadcn/ui Components Figma kit by
sitsiilia](https://www.figma.com/community/file/1342715840824755935/shadcn-ui-components-with-variables-tailwind-classes-updated-august-2026)**.

Ask *"how do I build a modal?"* and get the code — imports, JSX, a sentence,
and a link to the component in Figma. No research, no preamble.

## What it knows

- **361 worked examples** authored in the kit itself, with the composition of
  each one as it is built in Figma
- **60 components / 323 parts** — the real props, values and defaults, read
  from the component source rather than inferred from the design file
- **The token layer** — colours, radius ramp, typography, shadows, and the
  focus treatment
- **Where this library differs from stock shadcn/ui** — which is the part an
  agent gets wrong otherwise

## Why it is accurate

The Figma variant axes are *not* the code API. `State`, `Dir` and `Position`
are CSS states, logical properties and parent-derived positioning — not props.
`Roudness` is a class. An agent reading the design axes and writing them as
JSX produces code that does not compile.

This skill carries both, separately: `--api` is the code API, `--figma` is the
design API, and every prop and value it advertises is verified to exist in the
shipped components.

## Requirements

- **Node** (the lookup is a small script; no network, no API key)
- The components installed in the target project — see *Installing the
  library* in `SKILL.md`
- Tailwind CSS v4 and React 18/19

## Install

```bash
git clone https://github.com/Sitsiilia/shadcn-figma-skill.git \
  ~/.claude/skills/figma-shadcn-by-sitsiilia
```

Or copy the directory into `~/.claude/skills/` (available everywhere) or a
project's `.claude/skills/` (that project only).

## Contents

```
SKILL.md              the answer template and the divergence table
references/           components, tokens, conventions
data/                 recipes, code API, Figma links — all bundled, all offline
scripts/find.mjs      the lookup
```

## Ecosystem

- **Library** — [Figma Community](https://www.figma.com/community/file/1342715840824755935/shadcn-ui-components-with-variables-tailwind-classes-updated-august-2026)
- **Plugin** — [shadcn/ui create](https://www.figma.com/community/plugin/1582277338374276192/shadcn-ui-create) re-themes the whole file: colours, typography, icons, tokens
- **Support** — [ko-fi.com/sitsiilia](https://ko-fi.com/sitsiilia)

By [@sitsiilia](https://x.com/sitsiilia).

## Keeping this working

The shadcn CLI installs `latest` for a component's dependencies and ignores
version ranges. That means a major release of Radix, Lucide or anything else
can break new installs without a single change here.

[`scripts/verify-registry.mjs`](scripts/verify-registry.mjs) guards against it:
it installs all 63 components into a throwaway project and compiles them.

```bash
node scripts/verify-registry.mjs r
```

CI runs it on every push and every Monday, so a breaking upstream release shows
up as a failed check rather than a bug report.
