import { defineConfig } from 'tsup';

// Self-contained ESM + CJS + .d.ts. React stays external (peer dep). The
// "use client" banner marks the output as a client module so it drops into a
// Next.js App Router server component without a wrapper.
export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react'],
  banner: { js: '"use client";' },
});
