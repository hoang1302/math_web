import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../utils/api';
import MathRenderer from '../components/MathRenderer';

const QuizResults = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result) {
      fetchResult();
    } else {
      fetchQuizDetails();
    }
  }, []);

  useEffect(() => {
    if (result) {
      fetchQuizDetails();
    }
  }, [result]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/quizzes/${id}/results`);
      if (response.data.data && response.data.data.length > 0) {
        setResult(response.data.data[0]);
        fetchQuizDetails();
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching result:', err);
      setLoading(false);
    }
  };

  const fetchQuizDetails = async () => {
    try {
      const response = await api.get(`/quizzes/${id}`);
      setQuiz(response.data.data);
      
      // Fetch question details
      if (response.data.data.questions) {
        const questionPromises = response.data.data.questions.map(qId => {
          const id = typeof qId === 'string' ? qId : qId?._id;
          return api.get(`/exercises/${id}?includeAnswers=true`);
        });
        const questionResponses = await Promise.all(questionPromises);
        setQuestions(questionResponses.map(res => res.data.data));
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải kết quả...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Không tìm thấy kết quả</p>
        <Link to="/exam" className="text-primary-600 hover:underline">
          Quay lại danh sách bài luyện tập
        </Link>
      </div>
    );
  }

  const percentage = result.percentage || 0;
  const isPassed = percentage >= 50;
  const wrongAnswers = result.answers?.filter(a => !a.isCorrect) || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Summary Card */}
      <div className={`bg-white rounded-xl shadow-md p-8 mb-6 ${
        isPassed ? 'border-2 border-green-200' : 'border-2 border-red-200'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">{isPassed ? '🎉' : '😔'}</div>
          <h1 className="text-3xl font-bold mb-2">
            {isPassed ? 'Chúc mừng!' : 'Cố gắng lần sau nhé!'}
          </h1>
          <div className="text-5xl font-bold mb-4" style={{ color: isPassed ? '#10b981' : '#ef4444' }}>
            {percentage}%
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-gray-600 text-sm">Điểm số</p>
              <p className="text-2xl font-bold">{result.score} / {result.totalScore}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Câu đúng</p>
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers} / {result.totalQuestions}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Thời gian</p>
              <p className="text-2xl font-bold">{Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results - Hiện đáp án */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 Chi tiết từng câu - Đáp án</h2>
        <div className="space-y-6">
          {result.answers?.map((answer, index) => {
            const question = questions[index];
            const isWrong = !answer.isCorrect;
            const correctAnswer = answer.correctAnswer ?? questions[index]?.correctAnswer;
            const explanation = answer.explanation ?? questions[index]?.explanation;
            
            return (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 ${
                  answer.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{answer.isCorrect ? '✅' : '❌'}</span>
                    <span className="font-semibold text-lg">Câu {index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {answer.points || 1} điểm
                  </span>
                </div>

                {/* Question */}
                {question && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Câu hỏi:</p>
                    <div className="text-base">
                      <MathRenderer content={question.question} />
                    </div>
                  </div>
                )}

                {/* Answers */}
                <div className="space-y-2 mb-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Đáp án của bạn:</p>
                    <p className="font-medium text-lg">
                      <MathRenderer content={String(answer.userAnswer)} />
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-100 rounded-lg border-2 border-green-300">
                    <p className="text-sm text-green-700 mb-1 font-medium">Đáp án đúng:</p>
                    <p className="font-bold text-lg text-green-800">
                      <MathRenderer content={String(correctAnswer || 'N/A')} />
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                {explanation && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2 font-medium">Giải thích:</p>
                    <MathRenderer content={explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(`/quiz/${id}`)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            🔄 Làm lại bài luyện tập
          </button>
          <Link
            to="/quiz"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
          >
            Danh sách bài luyện tập
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
          >
            ✅ Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
