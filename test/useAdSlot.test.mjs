// Manual effect-invocation test (no React renderer): exercises attachAdSlot,
// the exact effect body useAdSlot runs, against a stubbed window.adviverse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachAdSlot } from '../dist/index.js';

test('renders with tag on attach and destroys on cleanup', async () => {
  const calls = [];
  globalThis.window = {
    adviverse: {
      render: (el, o) => calls.push(['render', el, o]),
      destroy: (el) => calls.push(['destroy', el]),
    },
  };
  const el = { id: 'stub' };
  const cleanup = attachAdSlot(el, { tag: 'tk_x', sizes: '300x250' });
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(calls[0], ['render', el, { tag: 'tk_x', sizes: '300x250' }]);
  cleanup();
  assert.deepEqual(calls[1], ['destroy', el]);
});

test('cleanup before SDK resolves skips render', async () => {
  const calls = [];
  globalThis.window = { adviverse: { render: () => calls.push('render'), destroy: () => calls.push('destroy') } };
  attachAdSlot({}, { tag: 't' })();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(calls, ['destroy']);
});
