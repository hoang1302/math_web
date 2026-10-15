import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import MathRenderer from '../components/MathRenderer';

const QuizTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const autoSubmitted = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || !startTime) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const response = await api.post('/quizzes/' + id + '/submit', {
        answers: Object.entries(answers).map(([exerciseId, userAnswer]) => ({ exerciseId, userAnswer })),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
      });
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      navigate('/quiz/' + id + '/results', { state: { result: response.data.data } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, id, navigate, startTime]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setStartTime(null);
    setSubmitting(false);
    submittingRef.current = false;
    autoSubmitted.current = false;
    const startQuiz = async () => {
      try {
        const response = await api.post('/quizzes/' + id + '/start', {}, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setQuiz(response.data.data);
        setTimeLeft(response.data.data.timeLimit * 60);
        setStartTime(Date.now());
      } catch (error) {
        if (!controller.signal.aborted) console.error('Error starting quiz:', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    startQuiz();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!startTime || !quiz) return;
    const deadline = startTime + quiz.timeLimit * 60000;
    const timer = setInterval(() => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [startTime, quiz]);

  useEffect(() => {
    if (startTime && timeLeft === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      handleSubmit();
    }
  }, [startTime, timeLeft, handleSubmit]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitClick = async () => {
    if (submitting) return;

    if (!window.confirm('Bạn có chắc muốn nộp bài?')) {
      return;
    }

    await handleSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Không tìm thấy quiz</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === quiz.questions.length - 1;
  const isFirst = currentQuestionIndex === 0;

  return (
    <div className="min-h-screen bg-page bg-home">
      {/* Header with Timer */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
              <p className="text-sm text-gray-600">
                Câu {currentQuestionIndex + 1} / {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-800'
                }`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                Câu {currentQuestionIndex + 1}
              </span>
              {currentQuestion.difficulty && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {currentQuestion.difficulty === 'easy' ? 'Dễ' : currentQuestion.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                </span>
              )}
            </div>
            <div className="text-lg">
              <MathRenderer content={currentQuestion.question} />
            </div>
            {/* Question Image */}
            {currentQuestion.questionImage && currentQuestion.questionImage.length > 0 && (
              <div className="mt-4">
                <img
                  src={
                    currentQuestion.questionImage.startsWith('http') || currentQuestion.questionImage.startsWith('blob:')
                      ? currentQuestion.questionImage
                      : `${getBaseUrl()}${currentQuestion.questionImage}`
                  }
                  alt="Hình ảnh câu hỏi"
                  className="max-w-full h-auto max-h-96 rounded-lg border shadow-sm mx-auto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            {currentQuestion.type === 'multiple-choice' ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQuestion._id] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name={`answer-${currentQuestion._id}`}
                      value={option}
                      checked={answers[currentQuestion._id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      className="mr-3"
                    />
                    <MathRenderer content={option} />
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[currentQuestion._id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                placeholder="Nhập đáp án của bạn"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={isFirst}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Câu trước
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={isLast}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Câu tiếp theo →
            </button>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {quiz.questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`p-3 rounded-lg font-semibold transition-colors ${index === currentQuestionIndex
                  ? 'bg-primary-600 text-white'
                  : answers[q._id]
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;

