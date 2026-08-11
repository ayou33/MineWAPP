# src/store — Global State

SolidJS store with typed selectors and scoped actions.

## Files
| File | Role |
|---|---|
| `store.config.ts` | **Project config** — `State` type + `initialState`; edit to add/remove slices |
| `index.ts` | Infra — `useSelector(fn, ensure?)`, `createScopedActions(key, actions)` (**do not edit**) |

## Usage
```ts
const name = useSelector(s => s.user.name)          // reactive memo
const actions = createScopedActions('user', {
  setName(set, name: string) { set('name', name) }
})
actions.setName('Alice')
```

## Conventions
- Never mutate store slices outside actions.
- `useSelector(..., true)` throws when the selected value is nil (typed non-null).
- Global ambient types (`NotNull`, `TailParams`, …) come from `src/types.d.ts`.
