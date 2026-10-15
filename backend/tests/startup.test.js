import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('startup fails clearly before database access when JWT_SECRET is missing', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
    env: { ...process.env, JWT_SECRET: '', NODE_ENV: 'development' },
    encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Set JWT_SECRET/);
});
