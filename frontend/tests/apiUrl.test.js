import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiUrl, getStaticBaseUrl } from '../src/utils/apiUrl.js';

test('defaults to the same-origin API proxy', () => {
  assert.equal(resolveApiUrl(), '/api');
  assert.equal(resolveApiUrl('   '), '/api');
  assert.equal(getStaticBaseUrl('/api'), '');
});
test('normalizes whitespace and trailing slashes', () => {
  assert.equal(resolveApiUrl(' https://example.com/api/// '), 'https://example.com/api');
});
test('removes only the terminal /api when resolving uploads', () => {
  assert.equal(getStaticBaseUrl('https://api.example.com/nested/api/'), 'https://api.example.com/nested');
  assert.equal(getStaticBaseUrl('https://example.com/api-service'), 'https://example.com/api-service');
});
