import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import '../models/index.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import { submitQuiz } from '../controllers/quizController.js';

const questions = [
  { _id: 'one', correctAnswer: 12, points: 2, lessonId: { topicId: 'topic' } },
  { _id: 'two', correctAnswer: 'A', points: 1, lessonId: { topicId: 'topic' } },
];
function response() {
  return { code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('submitQuiz persists a consistent score including omitted questions', async () => {
  const stubs = [
    mock.method(Quiz, 'findById', () => ({ populate: async () => ({ _id: 'quiz', isActive: true, questions, totalPoints: 999 }) })),
    mock.method(QuizResult, 'create', async value => value),
    mock.method(Badge, 'find', async () => []),
    mock.method(UserBadge, 'find', async () => []),
  ];
  try {
    const res = response();
    await submitQuiz({ params: { id: 'quiz' }, user: { id: 'student' }, body: {
      answers: [{ exerciseId: 'two', userAnswer: 'A' }], timeSpent: 5,
    } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.data.score, 1);
    assert.equal(res.body.data.totalScore, 3);
    assert.equal(res.body.data.wrongAnswers, 1);
    assert.deepEqual(res.body.data.topicStats, [{ topicId: 'topic', correct: 1, total: 2 }]);
  } finally { stubs.forEach(stub => stub.mock.restore()); }
});
for (const [name, body] of [
  ['duplicate answers', { answers: [{ exerciseId: 'one', userAnswer: 12 }, { exerciseId: 'one', userAnswer: 12 }] }],
  ['foreign question', { answers: [{ exerciseId: 'other', userAnswer: 12 }] }],
  ['negative time', { answers: [], timeSpent: -1 }],
  ['non-numeric time', { answers: [], timeSpent: '5' }],
  ['missing answers', {}],
]) {
  test('submitQuiz rejects ' + name + ' before saving', async () => {
    const quizStub = mock.method(Quiz, 'findById', () => ({ populate: async () => ({ _id: 'quiz', isActive: true, questions }) }));
    const resultStub = mock.method(QuizResult, 'create', async () => assert.fail('Must not save an invalid submission'));
    try {
      const res = response();
      await submitQuiz({ params: { id: 'quiz' }, user: { id: 'student' }, body }, res);
      assert.equal(res.code, 400);
      assert.equal(resultStub.mock.callCount(), 0);
    } finally { quizStub.mock.restore(); resultStub.mock.restore(); }
  });
}
