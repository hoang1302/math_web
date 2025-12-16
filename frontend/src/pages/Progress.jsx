import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { PieChart, Pie, Cell, RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';

const Progress = () => {
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgress();
    fetchStats();
  }, []);

  // Refresh data when component is focused (user navigates back to this page)
  useEffect(() => {
    const handleFocus = () => {
      fetchProgress();
      fetchStats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/progress');
      setProgress(response.data.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/progress/stats');
      setStats(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải thống kê');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Không có dữ liệu'}</p>
      </div>
    );
  }

  const { overview, topicProgress, completedLessonsList, completedQuizzesList } = stats;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tiến độ học tập</h1>
        <p className="text-gray-600">Xem chi tiết tiến độ học tập của bạn</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Tổng số bài học</p>
          <p className="text-3xl font-bold text-primary-700">
            {overview?.totalLessons || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Đã hoàn thành</p>
          <p className="text-3xl font-bold text-green-600">
            {overview?.completedLessons || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Số quiz đã làm</p>
          <p className="text-3xl font-bold text-blue-600">
            {overview?.quizCount || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Điểm trung bình</p>
          <p className="text-3xl font-bold text-purple-600">
            {overview?.averageScore || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Thời gian học</p>
          <p className="text-3xl font-bold text-orange-600">
            {overview?.totalStudyTime || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">phút</p>
        </div>
      </div>

      {/* Progress Diagram - Circular Progress */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">Sơ đồ tiến độ tổng quan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lesson Progress Circle */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-medium text-gray-600 mb-4">Tiến độ bài học</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Đã hoàn thành', value: overview?.completedLessons || 0 },
                    { name: 'Chưa hoàn thành', value: (overview?.totalLessons || 0) - (overview?.completedLessons || 0) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-primary-700">
                {overview?.completionPercentage || 0}%
              </p>
              <p className="text-sm text-gray-600">
                {overview?.completedLessons || 0} / {overview?.totalLessons || 0} bài học
              </p>
            </div>
          </div>

          {/* Quiz Progress Circle */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-medium text-gray-600 mb-4">Quiz đã làm</h4>
            <div className="flex items-center justify-center w-full h-[200px]">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">
                      {overview?.quizCount || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">quiz</p>
                  </div>
                </div>
                {overview?.quizCount > 0 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Điểm TB: {overview?.quizAverageScore || 0}%
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">quiz đã hoàn thành</p>
            </div>
          </div>

        </div>
      </div>

      {/* Completed Lessons List */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Danh sách bài đã học</h3>
        <div className="space-y-4">
          {completedLessonsList && completedLessonsList.length > 0 ? (
            completedLessonsList.map((lesson) => (
              <div
                key={lesson.lessonId}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/lessons/${lesson.lessonId}`}
                        className="font-semibold text-lg hover:text-primary-700 transition-colors"
                      >
                        {lesson.title}
                      </Link>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ✓ Hoàn thành
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {lesson.topicTitle && (
                        <span>📚 {lesson.topicTitle}</span>
                      )}
                      <span>⭐ Điểm: {lesson.bestScore}</span>
                      <span>🔄 {lesson.attempts} lần thử</span>
                      {lesson.timeSpent > 0 && (
                        <span>⏱️ {lesson.timeSpent} phút</span>
                      )}
                      {lesson.completedAt && (
                        <span>📅 {new Date(lesson.completedAt).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    {lesson.completionPercentage > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${lesson.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/lessons/${lesson.lessonId}`}
                    className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Xem lại
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>Bạn chưa hoàn thành bài học nào</p>
              <Link
                to="/lessons"
                className="text-primary-600 hover:underline mt-2 inline-block"
              >
                Bắt đầu học ngay →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Completed Quizzes List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Danh sách quiz đã làm</h3>
        <div className="space-y-4">
          {completedQuizzesList && completedQuizzesList.length > 0 ? (
            completedQuizzesList.map((quiz) => (
              <div
                key={quiz.quizId}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-800">
                        {quiz.title}
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        ✓ Đã hoàn thành
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className={`font-semibold ${
                        quiz.percentage >= 80 ? 'text-green-600' :
                        quiz.percentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        📊 Điểm: {quiz.percentage}%
                      </span>
                      <span>✅ {quiz.correctAnswers}/{quiz.totalQuestions} câu đúng</span>
                      <span>⏱️ {Math.floor(quiz.timeSpent / 60)} phút {quiz.timeSpent % 60} giây</span>
                      {quiz.completedAt && (
                        <span>📅 {new Date(quiz.completedAt).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quiz.percentage >= 80 ? 'bg-green-600' :
                            quiz.percentage >= 60 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${quiz.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>Bạn chưa làm quiz nào</p>
              <Link
                to="/quizzes"
                className="text-primary-600 hover:underline mt-2 inline-block"
              >
                Làm quiz ngay →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;

