import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';

const Practice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseId = searchParams.get('exerciseId');

  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [formData, setFormData] = useState({
    topicId: '',
    lessonId: '',
    difficulty: 'medium',
    limit: 5,
  });
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [practiceStarted, setPracticeStarted] = useState(false);

  useEffect(() => {
    fetchTopics();
    if (exerciseId) {
      // Start practice with single exercise
      startSingleExercise(exerciseId);
    }
  }, [exerciseId]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchLessons = async (topicId) => {
    try {
      const response = await api.get(`/lessons?topicId=${topicId}`);
      setLessons(response.data.data);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const startSingleExercise = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/exercises/${id}`);
      setExercises([response.data.data]);
      setPracticeStarted(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching exercise:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'topicId' && value) {
      fetchLessons(value);
    }
  };

  const startPractice = async () => {
    try {
      setLoading(true);
      const params = {
        limit: parseInt(formData.limit),
      };
      
      if (formData.lessonId) {
        params.lessonId = formData.lessonId;
      }
      
      if (formData.difficulty) {
        params.difficulty = formData.difficulty;
      }

      const response = await api.get('/exercises/random', { params });
      setExercises(response.data.data);
      setPracticeStarted(true);
      setCurrentExerciseIndex(0);
      setUserAnswers({});
      setResults({});
      setShowResult(false);
      setLoading(false);
    } catch (err) {
      console.error('Error starting practice:', err);
      setLoading(false);
    }
  };

  const handleAnswerChange = (exerciseId, answer) => {
    setUserAnswers({ ...userAnswers, [exerciseId]: answer });
  };

  const checkAnswer = async (exerciseId) => {
    try {
      const userAnswer = userAnswers[exerciseId];
      if (userAnswer === undefined || userAnswer === '') {
        alert('Vui lòng nhập đáp án');
        return;
      }

      const response = await api.post('/exercises/check', {
        exerciseId,
        userAnswer,
      });

      setResults({ ...results, [exerciseId]: response.data });
      setShowResult(true);
    } catch (err) {
      console.error('Error checking answer:', err);
      alert('Có lỗi xảy ra khi kiểm tra đáp án');
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setShowResult(false);
    }
  };

  const finishPractice = () => {
    const correctCount = Object.values(results).filter(r => r.isCorrect).length;
    const totalCount = exercises.length;
    alert(`Hoàn thành!\nĐúng: ${correctCount}/${totalCount} (${Math.round((correctCount / totalCount) * 100)}%)`);
    setPracticeStarted(false);
    setExercises([]);
    setCurrentExerciseIndex(0);
    setUserAnswers({});
    setResults({});
    setShowResult(false);
  };

  if (practiceStarted && exercises.length > 0) {
    const currentExercise = exercises[currentExerciseIndex];
    const result = results[currentExercise._id];
    const isLast = currentExerciseIndex === exercises.length - 1;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Câu {currentExerciseIndex + 1} / {exercises.length}
            </span>
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn kết thúc luyện tập?')) {
                  finishPractice();
                }
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Kết thúc
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {currentExercise.difficulty === 'easy' ? 'Dễ' : currentExercise.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {currentExercise.type === 'multiple-choice' ? 'Trắc nghiệm' : currentExercise.type === 'fill-blank' ? 'Điền khuyết' : 'Tự luận'}
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-4">Câu hỏi:</h3>
            <div className="text-lg">
              <MathRenderer content={currentExercise.question} />
            </div>
          </div>

          {/* Answer Input */}
          {!showResult && (
            <div className="mb-6">
              {currentExercise.type === 'multiple-choice' ? (
                <div className="space-y-3">
                  {currentExercise.options?.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`answer-${currentExercise._id}`}
                        value={option}
                        checked={userAnswers[currentExercise._id] === option}
                        onChange={(e) => handleAnswerChange(currentExercise._id, e.target.value)}
                        className="mr-3"
                      />
                      <MathRenderer content={option} />
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={userAnswers[currentExercise._id] || ''}
                  onChange={(e) => handleAnswerChange(currentExercise._id, e.target.value)}
                  placeholder="Nhập đáp án của bạn"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                />
              )}
            </div>
          )}

          {/* Result */}
          {showResult && result && (
            <div className={`mb-6 p-6 rounded-lg ${
              result.isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">{result.isCorrect ? '✅' : '❌'}</span>
                <span className={`text-xl font-semibold ${
                  result.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.isCorrect ? 'Đúng rồi!' : 'Sai rồi!'}
                </span>
              </div>
              {!result.isCorrect && (
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Đáp án đúng:</strong>
                  </p>
                  <div className="text-lg">
                    <MathRenderer content={String(result.correctAnswer)} />
                  </div>
                </div>
              )}
              {result.explanation && (
                <div className="mb-4">
                  <p className="text-gray-700 mb-2 font-medium">
                    <strong>Giải thích chi tiết:</strong>
                  </p>
                  <MathRenderer content={result.explanation} />
                </div>
              )}
              {!result.isCorrect && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-2">
                    💡 Gợi ý:
                  </p>
                  <p className="text-yellow-800 mb-2">
                    {result.hint || 'Bạn nên xem lại phần lý thuyết liên quan để hiểu rõ hơn về kiến thức này.'}
                  </p>
                  {currentExercise.lessonId && (
                    <Link
                      to={`/lessons/${typeof currentExercise.lessonId === 'object' ? currentExercise.lessonId._id : currentExercise.lessonId}`}
                      className="text-yellow-800 hover:text-yellow-900 underline text-sm inline-block"
                    >
                      Xem lại bài học liên quan →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            {!showResult ? (
              <button
                onClick={() => checkAnswer(currentExercise._id)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Kiểm tra đáp án
              </button>
            ) : (
              <div className="flex space-x-4">
                {!isLast ? (
                  <button
                    onClick={nextExercise}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Câu tiếp theo →
                  </button>
                ) : (
                  <button
                    onClick={finishPractice}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Luyện tập</h1>
        <p className="text-gray-600">Chọn chủ đề và mức độ khó để bắt đầu luyện tập</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startPractice();
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề (tùy chọn)
            </label>
            <select
              name="topicId"
              value={formData.topicId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Tất cả chủ đề</option>
              {topics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>

          {formData.topicId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bài học (tùy chọn)
              </label>
              <select
                name="lessonId"
                value={formData.lessonId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tất cả bài học</option>
                {lessons.map((lesson) => (
                  <option key={lesson._id} value={lesson._id}>
                    Bài {lesson.order}: {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức độ khó
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng câu hỏi
            </label>
            <input
              type="number"
              name="limit"
              value={formData.limit}
              onChange={handleChange}
              min="1"
              max="20"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tải...' : 'Bắt đầu luyện tập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Practice;

