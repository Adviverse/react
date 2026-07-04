# @adviverse/react

React components for [Adviverse](https://adviverse.com) ad slots. One import — no `dangerouslySetInnerHTML`, no `document.currentScript` workarounds, no manual script loading.

```bash
npm i @adviverse/react
```

## Quick start

```tsx
import { AdSlot } from '@adviverse/react';

export function Sidebar() {
  return <AdSlot tag="tk_80f77ad8d23bdbd927" sizes="300x600" style={{ width: 300, height: 600 }} />;
}
```

Size the slot with `style`/`className` (or pass `sizes`) — the ad matches the box. That's the whole integration. The SDK loads once, lazily; slots tear down on unmount.

## Next.js (App Router)

Refill slots on client-side navigation with `<AdRefresh>`:

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { AdRefresh } from '@adviverse/react';

// render once in app/layout.tsx
export function Ads() { return <AdRefresh routeKey={usePathname()} />; }
```

## API

| Export | Purpose |
| --- | --- |
| `<AdSlot tag sizes? style? />` | A single ad slot. `sizes`: `"300x250"`, a list `"160x600,300x600"`, or `"fluid"`. |
| `<AdRefresh routeKey />` | Refill slots when `routeKey` changes (SPA route change). Idempotent. |
| `<AdScript endpoint? />` | Load the SDK once, explicitly (optional — `AdSlot` loads it lazily). |
| `loadSdk(endpoint?)` | Promise that resolves when the SDK is ready. |

## Content Security Policy

If you run a CSP, allow the Adviverse hosts:

```
script-src  https://serve.adviverse.com
img-src     https://cdn.adviverse.com https://serve.adviverse.com data:
connect-src https://serve.adviverse.com
```

## Debugging

Add `?adviverse_debug=1` to the URL (or set `window.ADVIVERSE_DEBUG = true`) to console-log each request, the resolved size, and any no-fill reason. Use the reserved tag `tk_test` to render a labeled test ad that always fills — verify your integration before a campaign is live.
