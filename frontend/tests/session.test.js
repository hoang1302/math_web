import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGrade, clearSession, readSession, saveSession } from '../src/utils/session.js';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
test('restores the current user and grade', () => {
  const user = { id: 'student', profile: { grade: 3 } };
  assert.deepEqual(readSession(storage({ token: 'token', user: JSON.stringify(user), selectedGrade: '5' })), { user, grade: 3 });
});
for (const value of ['{broken', 'null', '[]', '42', '{}']) {
  test('clears invalid saved user ' + value, () => {
    const saved = storage({ token: 'token', user: value, selectedGrade: '3' });
    assert.deepEqual(readSession(saved), { user: null, grade: null });
    assert.equal(saved.getItem('token'), null);
    assert.equal(saved.getItem('selectedGrade'), null);
  });
}
test('does not authenticate a user without a token', () => {
  assert.equal(readSession(storage({ user: JSON.stringify({ id: 'student' }) })).user, null);
});
test('logging into another account clears the previous grade', () => {
  const saved = storage({ selectedGrade: '4' });
  assert.equal(saveSession(saved, 'new-token', { id: 'new-student' }), null);
  assert.equal(saved.getItem('selectedGrade'), null);
});
test('logout clears all session values but preserves unrelated settings', () => {
  const saved = storage({ token: 'token', user: '{}', selectedGrade: '3', theme: 'light' });
  clearSession(saved);
  assert.equal(saved.getItem('token'), null);
  assert.equal(saved.getItem('selectedGrade'), null);
  assert.equal(saved.getItem('theme'), 'light');
});
test('grades must be integers between 1 and 5', () => {
  for (const value of [0, 6, 1.5, '', null, 'invalid', true, [3]]) assert.equal(normalizeGrade(value), null);
  assert.equal(normalizeGrade('4'), 4);
});
