// Numeric answers must consume the entire input ("12abc" is not 12).
export function isAnswerCorrect(correctAnswer, userAnswer) {
  if (correctAnswer == null || userAnswer == null) return false;
  if (Array.isArray(correctAnswer)) {
    return Array.isArray(userAnswer) && correctAnswer.length === userAnswer.length &&
      correctAnswer.every((answer, index) => isAnswerCorrect(answer, userAnswer[index]));
  }
  if (typeof correctAnswer === 'number') {
    if (!['string', 'number'].includes(typeof userAnswer) || String(userAnswer).trim() === '') return false;
    const number = Number(userAnswer);
    return Number.isFinite(number) && Math.abs(number - correctAnswer) < 0.0001;
  }
  return typeof userAnswer !== 'object' &&
    String(correctAnswer).trim().toLowerCase() === String(userAnswer).trim().toLowerCase();
}

export function gradeQuiz(questions, submittedAnswers) {
  const questionIds = new Set(questions.map(question => String(question._id)));
  const answersById = new Map();
  for (const answer of submittedAnswers) {
    const id = answer?.exerciseId;
    if (typeof id !== 'string' || !questionIds.has(id) || answersById.has(id) || answer.userAnswer == null) {
      const error = new Error('Each answer must reference a unique question in this quiz and include userAnswer');
      error.status = 400;
      throw error;
    }
    answersById.set(id, answer.userAnswer);
  }

  const answers = questions.map(question => {
    const id = String(question._id);
    const userAnswer = answersById.get(id) ?? '';
    const isCorrect = answersById.has(id) && isAnswerCorrect(question.correctAnswer, userAnswer);
    return {
      exerciseId: question._id,
      userAnswer,
      isCorrect,
      points: isCorrect ? question.points : 0,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
    };
  });
  const score = answers.reduce((sum, answer) => sum + answer.points, 0);
  const totalScore = questions.reduce((sum, question) => sum + question.points, 0);
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  return {
    answers, score, totalScore, correctAnswers,
    wrongAnswers: questions.length - correctAnswers,
    totalQuestions: questions.length,
    percentage: totalScore > 0 ? Math.round(score / totalScore * 100) : 0,
  };
}
