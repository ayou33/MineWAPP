# src/directives — SolidJS Custom Directives

| File | Purpose |
|---|---|
| `model.ts` | Two-way binding directive: `use:model={[value, setValue]}` on inputs |

## Adding a directive
1. Declare the prop in `declare module 'solid-js' { namespace JSX { interface Directives { … } } }`.
2. Export a `(el, accessor) => void` function; register cleanup with `onCleanup`.
3. Use `use:directiveName={...}` in JSX.

## Pitfalls
- Directive accessors re-run when the argument signal changes; guard against stale listeners with `onCleanup`.
- `model` expects a tuple accessor `Accessor<Signal<string>>` — keep the shape stable.
