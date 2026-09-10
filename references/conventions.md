# Conventions

The rules that make code "correct" in this library. Follow them and new
components will sit naturally beside the existing 55.

## Compose, don't configure

Every component is a root plus named parts. No component takes a `title` or
`description` prop:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team</CardTitle>
    <CardDescription>Manage who has access.</CardDescription>
    <CardAction><Badge>Pro</Badge></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

Every one of the 361 recipes is a composition. If you find yourself adding a
prop that takes a string of content, you are fighting the library.

## RTL costs nothing

No component takes a `dir` prop. Direction is handled with logical properties:

```
ps-* pe-* ms-* me-* start-* end-* border-s border-e
rounded-s-* rounded-e-* text-start text-end
rtl:rotate-180        (chevrons, arrows)
```

```tsx
<div dir="rtl">
  <Input placeholder="بريد إلكتروني" />
</div>
```

Almost every component page ships an RTL recipe — this is a first-class concern
in the kit, not an afterthought. Keep `left`/`right` only where the thing is
physically one-sided: a `side="right"` sheet, a `data-[side=bottom]` animation.

## Groups own their children

`ButtonGroup` and `ToggleGroup` collapse shared borders and overlap children by
1px. Children stay plain:

```tsx
<ButtonGroup>
  <Button variant="outline">Copy</Button>
  <Button variant="outline">Paste</Button>
</ButtonGroup>
```

Never give a child a position prop. The Figma sets have
`Position = Left | Middle | Right | Single` because Figma has no other way to
express it; in code the parent derives it from child order.

## States are CSS, not props

The Figma sets carry `State = Default | Hover | Focus | Disabled` because Figma
cannot render pseudo-classes. In code these are `hover:`, `focus-visible:` and
`disabled:`. Likewise `Data state` and `Selected` come from the underlying Radix
primitive as `data-[state=…]`, and `Text = Placeholder | Active` is content.

The one judgement call: `State=Destructive`. If it is a choice the author makes
(destructive Button, destructive Badge) it is a prop. If it is a validation
result (Input, Switch, Field) it is `aria-invalid`.

## Icon placement

Icons inside Button, Badge and Spinner carry a placement attribute:

```tsx
<Button>
  <MailIcon data-icon="inline-start" />
  Email
</Button>
```

Icons are 16px with a 2px stroke by default (1px inside Command, Calendar and
Sidebar), inherit `currentColor`, and never shrink.

## Tag every part

`data-slot="…"` on every element, matching the Figma layer name. It is how a
parent styles a child without prop drilling:

```tsx
"has-[>[data-slot=input-group-control]:focus-visible]:border-ring"
```

## Sizes are absolute

Control heights are `h-6 / h-7 / h-8 / h-9` (24/28/32/36) — the whole library
sits on that ladder. Do not substitute padding-driven sizing; mixed strategies
show up the moment two controls share a toolbar.

## Reuse the shared recipes

Focus, invalid, disabled and icon-sizing strings live in one module, as does the
menu-row recipe shared by DropdownMenu, ContextMenu, Menubar, Select and
Command. Import them; do not paste them. A fifth menu surface should use the
same recipe, not a sixth copy.
