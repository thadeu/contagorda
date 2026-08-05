# Conta Gorda

## Language

**Everything that is code is written in English. Everything the user reads is written in pt-BR.**

The line is who the reader is, not which file it lives in.

English: identifiers, file and directory names, types, database tables and
columns, API paths and JSON keys, **URL routes**, git commits, comments, tests,
and documentation.

pt-BR: strings that reach the screen — labels, buttons, headings, empty states,
error messages, `aria-label`, and anything else read by someone using the app.

`<html lang="pt-BR">` stays as it is. It declares the language of the content,
which is exactly the distinction above.

```tsx
// Right: English route, Portuguese label.
{ path: 'accounts/:id/edit', element: <EditAccountPage /> }
<Link to="/accounts/new">Nova conta</Link>
```

Routes belong to the English side even though they show up in the address bar.
They are part of the API surface the iOS app and any future client read, and a
path is a name in the codebase before it is text on a screen.
