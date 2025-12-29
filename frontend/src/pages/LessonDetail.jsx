import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';
import SlideViewer from '../components/SlideViewer';

const LessonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Practice state
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [practiceResults, setPracticeResults] = useState({});
  const [checkingAnswers, setCheckingAnswers] = useState({});
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [progressUpdated, setProgressUpdated] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('LessonDetail mounted with id:', id);
    return () => {
      console.log('LessonDetail unmounting');
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      // Reset practice state when switching to a new lesson
      setPracticeStarted(false);
      setUserAnswers({});
      setPracticeResults({});
      setCheckingAnswers({});
      setPracticeCompleted(false);
      setProgressUpdated(false);
      
      fetchLesson();
      fetchExercises();
    } else {
      setError('ID bài học không hợp lệ');
      setLoading(false);
    }
  }, [id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching lesson with id:', id);
      
      const response = await api.get(`/lessons/${id}`);
      console.log('Lesson response:', response.data);
      
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      
      // Handle both response.data.data and response.data formats
      const lessonData = response.data.data || response.data;
      
      if (!lessonData) {
        throw new Error('Invalid response format from server');
      }
      
      setLesson(lessonData);
      console.log('Lesson set:', lessonData);
      
      // Fetch all lessons in the same topic
      if (lessonData.topicId) {
        try {
          const topicId = lessonData.topicId._id || lessonData.topicId;
          console.log('Fetching lessons for topic:', topicId);
          const lessonsResponse = await api.get(`/lessons?topicId=${topicId}`);
          const lessonsData = lessonsResponse.data.data || lessonsResponse.data || [];
          setAllLessons(Array.isArray(lessonsData) ? lessonsData : []);
        } catch (topicErr) {
          console.error('Error fetching lessons in topic:', topicErr);
          setAllLessons([]);
        }
      } else {
        setAllLessons([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data || err.message);
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Không thể tải bài học. Vui lòng thử lại sau.';
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      // Fetch all exercises for this lesson
      const response = await api.get(`/exercises?lessonId=${id}`);
      setExercises(response.data.data);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    }
  };
  
  // Practice handlers
  const handleAnswerChange = (exerciseId, answer) => {
    // Update user answer (for multiple choice, this will trigger check)
    setUserAnswers({ ...userAnswers, [exerciseId]: answer });
    
    // For multiple choice, auto-check immediately
    if (answer !== undefined && answer !== '') {
      checkAnswer(exerciseId, answer);
    }
  };

  const checkAnswer = async (exerciseId, answer = null) => {
    const answerToCheck = answer !== null ? answer : userAnswers[exerciseId];
    
    if (answerToCheck === undefined || answerToCheck === '') {
      return;
    }

    setCheckingAnswers({ ...checkingAnswers, [exerciseId]: true });
    
    try {
      const response = await api.post('/exercises/check', {
        exerciseId,
        userAnswer: answerToCheck,
      });

      setPracticeResults({ ...practiceResults, [exerciseId]: response.data });
      
      // Check if all questions are answered
      const newAnswers = { ...userAnswers, [exerciseId]: answerToCheck };
      const allAnswered = exercises.every(ex => 
        newAnswers[ex._id] !== undefined && newAnswers[ex._id] !== ''
      );
      
      if (allAnswered) {
        setPracticeCompleted(true);
        setTimeout(() => {
          document.querySelector('[data-section="completion"]')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Error checking answer:', err);
      alert('Có lỗi xảy ra khi kiểm tra đáp án');
    } finally {
      setCheckingAnswers({ ...checkingAnswers, [exerciseId]: false });
    }
  };

  const startPractice = () => {
    setPracticeStarted(true);
    setUserAnswers({});
    setPracticeResults({});
    setPracticeCompleted(false);
    setProgressUpdated(false); // Reset progress update flag
    // Scroll to practice section
    setTimeout(() => {
      document.querySelector('[data-section="practice"]')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const currentIndex = allLessons.findIndex(l => l._id === id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const allQuestionsAnswered = exercises.length > 0 && exercises.every(ex => 
    userAnswers[ex._id] !== undefined && userAnswers[ex._id] !== ''
  );
  const correctCount = Object.values(practiceResults).filter(r => r?.isCorrect).length;
  const score = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0;

  // Update progress when practice is completed (only once)
  // MUST be before any early returns to follow Rules of Hooks
  useEffect(() => {
    const updateProgress = async () => {
      // Only update if all conditions are met and haven't updated yet
      if (practiceCompleted && allQuestionsAnswered && exercises.length > 0 && id && !progressUpdated) {
        try {
          console.log('Updating progress for lesson:', id, 'Score:', score);
          const response = await api.post(`/progress/lessons/${id}`, {
            completed: true,
            completionPercentage: 100,
            score: score,
            timeSpent: 0 // Có thể tính toán thời gian thực tế nếu cần
          });
          console.log('Progress updated successfully:', response.data);
          setProgressUpdated(true); // Mark as updated to prevent duplicate calls
          
          // Show success message
          if (response.data.newlyEarnedBadges && response.data.newlyEarnedBadges.length > 0) {
            console.log('New badges earned:', response.data.newlyEarnedBadges);
          }
        } catch (err) {
          console.error('Error updating progress:', err);
          console.error('Error details:', err.response?.data || err.message);
        }
      }
    };

    // Only run once when practice is completed
    if (practiceCompleted && allQuestionsAnswered && !progressUpdated) {
      updateProgress();
    }
  }, [practiceCompleted, allQuestionsAnswered, id, score, exercises.length, progressUpdated, correctCount]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài học</h2>
          <p className="text-red-600 mb-6">{error || 'Bài học không tồn tại hoặc đã bị xóa'}</p>
          <div className="space-y-3">
            <Link 
              to="/lessons" 
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Quay lại danh sách bài học
            </Link>
            <br />
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar: danh sách bài trong chủ đề */}
      <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="px-4 py-4 border-b border-gray-100">
          <Link
            to={`/lessons${lesson.topicId?._id ? `?topicId=${lesson.topicId._id}` : ''}`}
            className="text-primary-500 hover:text-primary-600 mb-2 inline-block text-sm font-semibold transition-colors"
          >
            ← Quay lại danh sách
          </Link>
          {lesson.topicId && (
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-1">
                {lesson.topicId.icon && (
                  <span className="text-2xl">{lesson.topicId.icon}</span>
                )}
                <span className="font-heading font-bold text-gray-800">
                  {lesson.topicId.title || 'Chủ đề'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Chọn bài để chuyển nhanh trong chủ đề
              </p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {allLessons.map((l) => (
            <button
              key={l._id}
              type="button"
              onClick={() => navigate(`/lessons/${l._id}`)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                l._id === id
                  ? 'bg-primary-100 text-primary-700 shadow-inner border border-primary-300'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="block truncate">
                Bài {l.order}: {l.title}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content: slide + practice */}
      <main className="flex-1 flex flex-col">
        {/* Mobile header đơn giản */}
        <div className="md:hidden px-4 pt-3 pb-2 border-b border-gray-100 bg-white/95">
          <Link
            to={`/lessons${lesson.topicId?._id ? `?topicId=${lesson.topicId._id}` : ''}`}
            className="text-primary-500 hover:text-primary-600 mb-1 inline-block text-xs font-semibold transition-colors"
          >
            ← Danh sách bài
          </Link>
          <h1 className="text-lg font-heading font-bold text-gray-900">
            {lesson.title || 'Bài học'}
          </h1>
          {lesson.topicId && (
            <p className="text-xs text-gray-500">
              {lesson.topicId.title || 'Chủ đề'} • Bài {lesson.order || ''}
            </p>
          )}
        </div>

        {/* Content - Học Lý thuyết qua Slides */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white" data-section="theory">
          {lesson.slides && lesson.slides.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4">
              <SlideViewer 
                slides={lesson.slides} 
                onStartPractice={startPractice}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-yellow-50 border-t border-yellow-200">
              <p className="text-yellow-800 text-center">
                ⚠️ Bài học này chưa có slide. Vui lòng liên hệ admin để cập nhật.
              </p>
            </div>
          )}
        </div>

        {/* Practice Section - Hiển thị tất cả câu hỏi */}
        {practiceStarted && exercises.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 max-w-7xl mx-auto border-4 border-action-200" data-section="practice">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-600">✏️ Làm bài tập</h2>
            <span className="text-base font-bold text-white bg-gradient-to-r from-action-400 to-action-500 px-4 py-2 rounded-full shadow-lg">
              {exercises.filter(ex => userAnswers[ex._id]).length} / {exercises.length} câu đã làm
            </span>
          </div>
          <p className="text-lg text-gray-700 mb-6 font-semibold">
            Chọn đáp án cho từng câu hỏi. Kết quả và giải thích sẽ hiển thị ngay sau khi bạn chọn.
          </p>

          <div className="space-y-6">
            {exercises.map((exercise, index) => {
              const result = practiceResults[exercise._id];
              const isChecking = checkingAnswers[exercise._id];
              const hasAnswer = userAnswers[exercise._id] !== undefined && userAnswers[exercise._id] !== '';
              
              return (
                <div 
                  key={exercise._id}
                  className={`border-4 rounded-2xl p-6 shadow-lg ${
                    result 
                      ? (result.isCorrect ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100' : 'border-red-400 bg-gradient-to-br from-red-50 to-red-100')
                      : 'border-primary-300 bg-gradient-to-br from-primary-50 to-blue-50'
                  }`}
                >
                  <div className="mb-4">
                    <span className="text-base font-heading font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 rounded-full shadow-md">
                      Câu {index + 1}
                    </span>
                  </div>
                  
                  <div className="text-lg mb-4">
                    <MathRenderer content={exercise.question} />
                  </div>

                  {/* Answer Input */}
                  {!result && (
                    <div className="mt-4">
                      {exercise.type === 'multiple-choice' ? (
                        <div className="space-y-3">
                          {exercise.options?.map((option, optIndex) => (
                          <label
                            key={optIndex}
                            className="flex items-center p-4 border-3 border-primary-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all bg-white shadow-md hover:shadow-lg"
                          >
                              <input
                                type="radio"
                                name={`answer-${exercise._id}`}
                                value={option}
                                checked={userAnswers[exercise._id] === option}
                                onChange={(e) => handleAnswerChange(exercise._id, e.target.value)}
                                disabled={isChecking}
                                className="mr-3"
                              />
                              <MathRenderer content={option} />
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={userAnswers[exercise._id] || ''}
                            onChange={(e) => {
                              setUserAnswers({ ...userAnswers, [exercise._id]: e.target.value });
                            }}
                            onBlur={(e) => {
                              if (e.target.value) {
                                checkAnswer(exercise._id, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value) {
                                checkAnswer(exercise._id, e.target.value);
                              }
                            }}
                            placeholder="Nhập đáp án của bạn"
                            disabled={isChecking}
                            className="w-full px-4 py-3 border-3 border-primary-300 rounded-xl focus:ring-4 focus:ring-primary-400 focus:border-primary-500 text-lg font-semibold disabled:opacity-50 shadow-md"
                          />
                          {hasAnswer && !result && (
                            <p className="text-sm text-gray-500">Nhấn Enter, Tab hoặc click ra ngoài để kiểm tra đáp án</p>
                          )}
                        </div>
                      )}
                      {isChecking && (
                        <div className="mt-4 flex items-center text-primary-600">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                          <span>Đang kiểm tra...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result - Hiển thị ngay sau khi chọn đáp án */}
                  {result && (
                    <div className={`mt-4 p-6 rounded-2xl border-4 shadow-xl ${
                      result.isCorrect 
                        ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-400' 
                        : 'bg-gradient-to-br from-red-100 to-red-200 border-red-400'
                    }`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-4xl animate-bounce">{result.isCorrect ? '✅' : '❌'}</span>
                        <span className={`text-2xl font-heading font-bold ${
                          result.isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.isCorrect ? 'Đúng rồi!' : 'Sai rồi!'}
                        </span>
                      </div>
                      
                      {!result.isCorrect && (
                        <div className="mb-4">
                          <p className="text-gray-700 mb-2 font-medium">
                            Đáp án đúng:
                          </p>
                          <div className="text-lg mb-4 p-3 bg-white rounded-lg">
                            <MathRenderer content={String(result.correctAnswer)} />
                          </div>
                        </div>
                      )}
                      
                      {result.explanation && (
                        <div className="mb-4">
                          <p className="text-gray-700 mb-2 font-medium">
                            Giải thích:
                          </p>
                          <div className="p-4 bg-white rounded-lg">
                            <MathRenderer content={result.explanation} />
                          </div>
                        </div>
                      )}
                      
                      {!result.isCorrect && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 font-medium mb-2">
                            💡 Gợi ý:
                          </p>
                          <p className="text-yellow-800 mb-2">
                            Bạn nên xem lại phần lý thuyết ở trên để hiểu rõ hơn về kiến thức này.
                          </p>
                          <button
                            onClick={() => {
                              document.querySelector('[data-section="theory"]')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-yellow-800 hover:text-yellow-900 underline text-sm"
                          >
                            Xem lại lý thuyết ↑
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Completion Section - Sau khi hoàn thành tất cả câu hỏi */}
        {practiceCompleted && allQuestionsAnswered && (
        <div className="bg-gradient-to-br from-green-100 via-emerald-100 to-green-200 border-4 border-green-400 rounded-3xl p-8 mb-6 shadow-2xl" data-section="completion">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-green-800 mb-3 drop-shadow-lg">Hoàn thành bài tập!</h2>
            <p className="text-xl md:text-2xl font-semibold text-green-700 mb-6">
              Bạn đã hoàn thành tất cả {exercises.length} câu hỏi của bài học "{lesson.title}"
            </p>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 max-w-md mx-auto border-4 border-action-300 shadow-xl">
              <h3 className="text-2xl font-heading font-bold mb-4 text-primary-600">Kết quả:</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Số câu đúng:</span>
                  <span className="font-heading font-bold text-green-600 text-2xl">
                    {correctCount} / {exercises.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Tỷ lệ đúng:</span>
                  <span className="font-heading font-bold text-primary-600 text-2xl">
                    {Math.round((correctCount / exercises.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              {nextLesson && (
                <Link
                  to={`/lessons/${nextLesson._id}`}
                  className="px-10 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-heading font-bold text-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 w-full sm:w-auto text-center"
                >
                  📖 Học bài tiếp theo →
                </Link>
              )}
              <Link
                to="/"
                className={`px-10 py-5 rounded-2xl font-heading font-bold text-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 w-full sm:w-auto text-center ${
                  nextLesson 
                    ? 'bg-gradient-to-r from-action-400 to-action-500 text-white hover:from-action-500 hover:to-action-600' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                }`}
              >
                🏠 Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default LessonDetail;
