import test from 'node:test';
import assert from 'node:assert/strict';
import { isAnswerCorrect, gradeQuiz } from '../utils/answers.js';

const cases = [
  ['trimmed text', 'Đáp án', ' đáp án ', true],
  ['numeric string', 12, '12.0', true],
  ['numeric tolerance', 12, '12.00001', true],
  ['different number', 12, '12.01', false],
  ['trailing characters', 12, '12abc', false],
  ['empty number', 0, '', false],
  ['whitespace number', 0, ' ', false],
  ['boolean number', 0, false, false],
  ['missing answer', 0, null, false],
  ['nonfinite answer', 12, Infinity, false],
  ['ordered arrays', [1, 'A'], ['1', ' a '], true],
  ['array with invalid number', [1], ['1abc'], false],
  ['wrong array length', [1, 2], [1], false],
  ['wrong array order', [1, 2], [2, 1], false],
  ['array instead of scalar', 'A', ['A'], false],
];
for (const [name, correct, answer, expected] of cases) {
  test(name, () => assert.equal(isAnswerCorrect(correct, answer), expected));
}

const questions = [
  { _id: 'one', correctAnswer: 12, points: 2 },
  { _id: 'two', correctAnswer: 'A', points: 1 },
];
test('scores in quiz order and counts unanswered questions as wrong', () => {
  const result = gradeQuiz(questions, [{ exerciseId: 'two', userAnswer: 'a' }]);
  assert.equal(result.score, 1);
  assert.equal(result.totalScore, 3);
  assert.equal(result.percentage, 33);
  assert.equal(result.correctAnswers, 1);
  assert.equal(result.wrongAnswers, 1);
  assert.deepEqual(result.answers.map(answer => answer.exerciseId), ['one', 'two']);
});
test('a fully unanswered quiz has zero points and every question wrong', () => {
  const result = gradeQuiz(questions, []);
  assert.equal(result.score, 0);
  assert.equal(result.wrongAnswers, 2);
});
test('full marks cannot exceed the current total points', () => {
  const result = gradeQuiz(questions, [
    { exerciseId: 'one', userAnswer: 12 }, { exerciseId: 'two', userAnswer: 'A' },
  ]);
  assert.equal(result.percentage, 100);
  assert.equal(result.score, result.totalScore);
});
for (const [name, answers] of [
  ['duplicate IDs', [{ exerciseId: 'one', userAnswer: 12 }, { exerciseId: 'one', userAnswer: 12 }]],
  ['foreign IDs', [{ exerciseId: 'other', userAnswer: 12 }]],
  ['malformed answers', [null]],
  ['missing userAnswer', [{ exerciseId: 'one' }]],
]) {
  test('rejects ' + name, () => assert.throws(() => gradeQuiz(questions, answers), { status: 400 }));
}
