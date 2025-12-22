import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

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
        <p className="text-red-600 mb-4">{error || 'Không có dữ liệu'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { overview, topicProgress = [] } = stats;

  // Prepare chart data
  const topicChartData = topicProgress && topicProgress.length > 0
    ? topicProgress.map(topic => ({
        name: topic.topicTitle || 'Chủ đề',
        percentage: topic.percentage || 0,
        completed: topic.completed || 0,
        total: topic.total || 0
      }))
    : [];

  const completionData = overview
    ? [
        { name: 'Đã hoàn thành', value: overview.completedLessons || 0, color: '#0ea5e9' },
        { name: 'Chưa hoàn thành', value: Math.max(0, (overview.totalLessons || 0) - (overview.completedLessons || 0)), color: '#e5e7eb' }
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Chào mừng, {user?.username}! 👋
        </h1>
        <p className="text-gray-600">Đây là tổng quan tiến độ học tập của bạn</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tiến độ hoàn thành</p>
              <p className="text-3xl font-bold text-primary-700">
                {overview?.completionPercentage || 0}%
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${overview?.completionPercentage || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview?.completedLessons || 0} / {overview?.totalLessons || 0} bài học
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Điểm trung bình</p>
              <p className="text-3xl font-bold text-green-600">
                {overview?.averageScore || 0}
              </p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Điểm số bài học</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Số Quiz đã làm</p>
              <p className="text-3xl font-bold text-purple-600">
                {overview?.quizCount || 0}
              </p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Điểm TB: {overview?.quizAverageScore || 0}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Thời gian học</p>
              <p className="text-3xl font-bold text-orange-600">
                {overview?.totalStudyTime || 0}
              </p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">phút</p>
        </div>
      </div>

      {/* Charts */}
      {topicChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Topic Progress */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Tiến độ theo chủ đề</h3>
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentage" fill="#0ea5e9" name="% Hoàn thành" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* Pie Chart - Completion */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Tỷ lệ hoàn thành</h3>
            {completionData.length > 0 && completionData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions - 3 lựa chọn chính */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Hành động nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/topics"
            className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg text-center hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-3">📚</div>
            <p className="font-bold text-lg mb-2">Học tập</p>
            <p className="text-xs text-gray-600">Chọn chủ đề → Xem lý thuyết → Làm ví dụ → Quiz</p>
          </Link>
          <Link
            to="/exam"
            className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg text-center hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-3">📝</div>
            <p className="font-bold text-lg mb-2">Luyện tập</p>
            <p className="text-xs text-gray-600">Chọn bài luyện tập lớn → Làm bài → Xem đáp án → Sửa sai</p>
          </Link>
          <Link
            to="/progress"
            className="p-6 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-lg text-center hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="text-5xl mb-3">📊</div>
            <p className="font-bold text-lg mb-2">Xem tiến độ</p>
            <p className="text-xs text-gray-600">Xem thống kê học tập chi tiết</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

