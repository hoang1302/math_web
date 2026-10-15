import jwt from 'jsonwebtoken';
import test, { before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import User from '../models/User.js';

let server;
let baseUrl;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

test('health endpoint works without opening a database connection', async () => {
  const response = await fetch(baseUrl + '/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
  assert.equal(response.headers.get('x-powered-by'), null);
});
test('unknown endpoints return structured JSON', async () => {
  const response = await fetch(baseUrl + '/api/unknown');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, message: 'Route not found' });
});
test('protected endpoint rejects missing tokens', async () => {
  const response = await fetch(baseUrl + '/api/auth/me');
  assert.equal(response.status, 401);
});
test('login validates missing credentials', async () => {
  const response = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 400);
});
test('bad credentials return 401 with their original error message', async () => {
  const stub = mock.method(User, 'findOne', () => ({ select: async () => null }));
  try {
    const response = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'missing@example.com', password: 'incorrect' }),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, 'Invalid credentials');
  } finally { stub.mock.restore(); }
});
test('malformed JSON is a client error', async () => {
  const response = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
});

test('anonymous callers cannot request exercise answer keys', async () => {
  for (const path of ['/api/exercises?includeAnswers=true', '/api/exercises/one?includeAnswers=true']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 401);
  }
});

test('students cannot request answer keys even with a valid token', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'local-test-signing-secret';
  const stub = mock.method(User, 'findById', async () => ({ id: 'student', role: 'user' }));
  try {
    const token = jwt.sign({ id: 'student' }, process.env.JWT_SECRET);
    const response = await fetch(baseUrl + '/api/exercises?includeAnswers=true', {
      headers: { Authorization: 'Bearer ' + token },
    });
    assert.equal(response.status, 403);
  } finally {
    stub.mock.restore();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
