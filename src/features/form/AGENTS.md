# src/features/form — Headless Form Engine

Reactive, headless form state with built-in validation rules, cascading fields, and derived relations.

## Files
| File | Role |
|---|---|
| `createForm.ts` | Engine: stores, `setValue`/`setTouched`/`setError`, `validate`/`validateField`, `submit`/`reset`/`resetField`, cascade (loop-protected), relation effects, bind helpers, `isValid`/`isDirty`/`isSubmitting` |
| `rules.ts` | `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, `match`, `oneOf`, `custom` |
| `types.ts` | `Rule`, `FormConfig`, `CascadeContext`, `Relation`, `FieldMeta`, `ValidateOn` |
| `index.ts` | Barrel |

## Usage
```ts
const form = createForm({
  initialValues: { name: '', age: 0, agree: false },
  rules: { name: [required('请输入姓名'), maxLength(30)], age: [min(0), max(120)] },
  cascade: { country: (v, ctx) => ctx.setValue('city', '') },
  relations: { total: { deps: ['price', 'qty'], compute: v => v.price * v.qty } },
  validateOn: 'blur',
})
// bind: <Input {...form.bind('name')} />  <Input {...form.bindNumber('age')} />
//       <Input type="checkbox" {...form.bindCheckbox('agree')} />  <Select {...form.bindSelect('role')} />
await form.submit(values => { … })
```

## Conventions
- `Rule` returns `true | string | Promise<true | string>`; empty string / array = invalid for `required`.
- Cascade handlers receive `CascadeContext` (`setValue`, `resetField`, `values`); loop protection is automatic.
- `relations` recompute a field whenever its deps change (deferred effect).
- Keep validators pure — they must not touch component state.
