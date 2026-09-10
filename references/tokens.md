# Tokens & install

## Install

```bash
npx shadcn@latest add https://raw.githubusercontent.com/Sitsiilia/shadcn-figma-skill/refs/heads/main/r/theme.json
```

Or drop `data/globals.css` into the project (typically `src/styles/globals.css` or
`app/globals.css`) and import it once at the root. It is self-contained: it
imports Tailwind, declares both themes, and wires everything into `@theme`.

Requires **Tailwind CSS v4** and React 18/19. Dark mode is class-based — put
`class="dark"` on `<html>`.

## Colour

| Token | Utility | Light | Dark |
| --- | --- | --- | --- |
| `--background` / `--foreground` | `bg-background` `text-foreground` | `#ffffff` / `#0a0a0a` | `#0a0a0a` / `#fafafa` |
| `--card` / `--card-foreground` | `bg-card` | `#ffffff` | `#171717` |
| `--popover` / `--popover-foreground` | `bg-popover` | `#ffffff` | `#262626` |
| `--primary` / `--primary-foreground` | `bg-primary` | `#171717` / `#fafafa` | `#e5e5e5` / `#171717` |
| `--secondary` / `--secondary-foreground` | `bg-secondary` | `#f5f5f5` | `#262626` |
| `--muted` / `--muted-foreground` | `bg-muted` | `#f5f5f5` / `#737373` | `#262626` / `#a1a1a1` |
| `--accent` / `--accent-foreground` | `bg-accent` | `#f5f5f5` / `#171717` | `#404040` / `#fafafa` |
| `--destructive` | `bg-destructive` | `#e7000b` | `#ff6467` |
| `--text-destructive` | `text-text-destructive` | `#e7000b` | `#ff6467` |
| `--destructive-subtle` | `bg-destructive-subtle` | `#e7000b1a` | `#ff64671f` |
| `--border` / `--input` | `border-border` `border-input` | `#e5e5e5` | `#ffffff1a` / `#ffffff26` |
| `--ring` | `border-ring` | `#737373` | `#737373` |
| `--ring-alpha` | `ring-ring-subtle` | `#a1a1a180` | `#a1a1a180` |
| `--chart-1..5` | `fill-chart-1` | Radix `blue` 8→12 | Radix `blueDark` 8→12 |
| `--sidebar*` | `bg-sidebar` … | 8 tokens | 8 tokens |

The palette is the **Tailwind `neutral` ramp**, not shadcn's oklch defaults, so
hexes differ slightly from `ui.shadcn.com`.

### Three destructive tokens

The split that trips people up:

```tsx
<Button variant="destructive">Delete</Button>   {/* --destructive        solid  */}
<Badge variant="destructive">Failed</Badge>     {/* --destructive-subtle tint   */}
<FieldError>Required.</FieldError>              {/* --text-destructive   text   */}
```

Using `destructive` where `destructive-subtle` belongs turns every subtle tint
into a solid red block.

### Focus is not `ring`

The focused *border* uses `ring` (neutral-500); the 3px *halo* uses a different
colour at 50% opacity. Two values, two tokens:

```
outline-none
focus-visible:border-ring
focus-visible:ring-ring-subtle
focus-visible:ring-[3px]
```

Invalid controls swap in `ring-ring-destructive` via `aria-invalid:`.

## Radius

`--radius: 0.625rem` (10px) is the anchor; every step is an offset from it.

| Utility | Value | Used by |
| --- | --- | --- |
| `rounded-xs` | 4px | checkbox |
| `rounded-sm` | 6px | `xs`/`sm` buttons, kbd, menu rows |
| `rounded-md` | 8px | skeleton, tabs trigger, toggle `sm` |
| `rounded-lg` | 10px | **default control radius** |
| `rounded-xl` | 14px | card, menu surfaces |
| `rounded-2xl` | 18px | dialog, popover, attachment |
| `rounded-3xl` | 22px | bubble |
| `rounded-4xl` | 26px | badge |
| `rounded-full` | pill | avatar, switch, `roundness="rounded"` |

Change `--radius` to reshape the whole system.

## Typography

Inter, tracking always normal. Each size is locked to one leading:

`text-xs` 12/16 · `text-sm` 14/20 (**default**) · `text-base` 16/24 ·
`text-lg` 18/28 · `text-xl` 20/28 · `text-2xl` 24/32 · `text-3xl` 30/36 ·
`text-4xl` 36/40

Weights in practice: `font-normal` body, `font-medium` controls and labels,
`font-semibold` titles.

## Elevation

`shadow-xs` on anything with a surface and a border · `shadow-md` on menus ·
`shadow-lg` on dialogs, popovers, sheets. All black at 10% — never tinted.

## Retheming

The kit is designed to be re-themed from `ui.shadcn.com/create` and applied via
the companion plugin, [shadcn/ui create](https://www.figma.com/community/plugin/1582277338374276192/shadcn-ui-create),
which changes themes, typography, icons and tokens across the whole Figma file.
It makes no network requests — changes are written locally into the file.

In code, replace the `:root` and `.dark` blocks in `globals.css` with the block
that tool emits.

## Provenance

`data/tokens.json` records where each value came from. Light values were read
from the Figma file; **dark values are marked `source: "derived"`** — the kit
has a dark mode but it was not readable at the available API scope. Say so if a
user depends on exact dark hexes.

## Linking back to Figma

Answers end with a link to the library on Figma Community, plus the name of the
page to open:

> https://www.figma.com/community/file/1342715840824755935/shadcn-ui-components-with-variables-tailwind-classes-updated-august-2026

If you work from your own duplicate of the kit, open the page named in the
answer — the page names are identical in any copy.
