import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';

/**
 * @adviverse/react — drop-in React components for Adviverse ad slots.
 *
 *   import { AdSlot } from '@adviverse/react';
 *   <AdSlot tag="tk_…" sizes="300x250" style={{ width: 300, height: 250 }} />
 *
 * No dangerouslySetInnerHTML, no document.currentScript workarounds, no manual
 * script loading. The SDK is loaded once (lazily), each slot fills the box you
 * size, and slots are torn down on unmount.
 */

type AdviverseGlobal = {
  render?: (el: HTMLElement, opts: { tag: string; sizes?: string }) => Promise<unknown>;
  destroy?: (el: HTMLElement) => void;
  refresh?: (root?: HTMLElement | Document) => Promise<{ filled: string[]; nofill: string[]; skipped: string[] }>;
  ready?: (cb: () => void) => void;
  version?: string;
};

declare global {
  interface Window {
    adviverse?: AdviverseGlobal;
    ADVIVERSE_ENDPOINT?: string;
    ADVIVERSE_DEBUG?: boolean;
  }
}

const DEFAULT_ENDPOINT = 'https://serve.adviverse.com';
// SDK major line this package targets — pins the loader to /sdk/v1.js so a
// breaking SDK change can't silently alter your integration. Bump with the
// package major (react@2 → 'v2').
const DEFAULT_VERSION = 'v1';

export interface LoadOptions {
  /** Ad-server origin. Default https://serve.adviverse.com (or window.ADVIVERSE_ENDPOINT). */
  endpoint?: string;
  /** SDK major line, e.g. "v1". Defaults to the line this package targets; pass "" for unversioned latest. */
  version?: string;
  /** Full SDK URL override (wins over endpoint/version) — exact pin or self-host. */
  src?: string;
}

function sdkUrl(opts: LoadOptions): string {
  if (opts.src) return opts.src;
  const base = (opts.endpoint || window.ADVIVERSE_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/$/, '');
  const version = opts.version ?? DEFAULT_VERSION;
  return version ? `${base}/sdk/${version}.js` : `${base}/sdk.js`;
}

let loadPromise: Promise<void> | null = null;

/** Load the Adviverse SDK once (idempotent). Resolves when it's ready. Accepts an
 *  endpoint string (back-compat) or {endpoint, version, src}. */
export function loadSdk(arg?: string | LoadOptions): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();
  if (window.adviverse && window.adviverse.render) return Promise.resolve();
  if (loadPromise) return loadPromise;
  const opts: LoadOptions = typeof arg === 'string' ? { endpoint: arg } : (arg ?? {});
  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-adviverse-sdk]') as HTMLScriptElement | null;
    if (existing) {
      if (window.adviverse && window.adviverse.render) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('adviverse sdk failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = sdkUrl(opts);
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-adviverse-sdk', '1');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('adviverse sdk failed to load'));
    document.head.appendChild(s);
  });
  return loadPromise;
}

export interface AdSlotProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Placement tag key, e.g. "tk_80f77ad8d23bdbd927". */
  tag: string;
  /**
   * Explicit size(s): "300x250", a comma list "160x600,300x600", or "fluid"
   * (fill the container width, server picks the height). Omit to size from the
   * element's own CSS box.
   */
  sizes?: string;
  /** Size the box here (or via className) — the ad matches it. */
  style?: CSSProperties;
  /** Ad-server origin override. */
  endpoint?: string;
  /** SDK major line, e.g. "v1" (default) or "v2"; "" for unversioned latest. */
  version?: string;
  /** Full SDK URL override (exact pin / self-host). */
  src?: string;
}

/**
 * A single ad slot. Size it with `style`/`className` (or pass `sizes`); the SDK
 * fills the box and tears down on unmount.
 */
export function AdSlot({ tag, sizes, endpoint, version, src, ...rest }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dead = false;
    const el = ref.current;
    loadSdk({ endpoint, version, src })
      .then(() => {
        if (dead || !el) return;
        window.adviverse?.render?.(el, { tag, sizes });
      })
      .catch(() => {});
    return () => {
      dead = true;
      if (el) window.adviverse?.destroy?.(el);
    };
  }, [tag, sizes, endpoint, version, src]);
  return <div ref={ref} data-tag={tag} data-sizes={sizes} {...rest} />;
}

/**
 * Loads the SDK once, explicitly (optional — <AdSlot> loads it lazily too). Handy
 * in a root layout, or to canary a version: `<AdScript version="v2" />`.
 */
export function AdScript({ endpoint, version, src }: LoadOptions) {
  useEffect(() => {
    loadSdk({ endpoint, version, src }).catch(() => {});
  }, [endpoint, version, src]);
  return null;
}

/**
 * Refill ad slots after a client-side route change (SPA). Pass a value that
 * changes per route — e.g. Next.js App Router: `<AdRefresh routeKey={usePathname()} />`.
 * Idempotent: already-filled slots are skipped and the popunder never re-arms.
 */
export function AdRefresh({ routeKey }: { routeKey?: string | number }) {
  useEffect(() => {
    window.adviverse?.refresh?.();
  }, [routeKey]);
  return null;
}
