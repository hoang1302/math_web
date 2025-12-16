import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [topicsRes, lessonsRes, exercisesRes, quizzesRes, usersRes] = await Promise.all([
        api.get('/topics'),
        api.get('/lessons'),
        api.get('/exercises'),
        api.get('/quizzes'),
        api.get('/users/stats')
      ]);

      setStats({
        topics: topicsRes.data.count || 0,
        lessons: lessonsRes.data.count || 0,
        exercises: exercisesRes.data.count || 0,
        quizzes: quizzesRes.data.count || 0,
        users: usersRes.data.data?.totalUsers || 0,
        students: usersRes.data.data?.totalStudents || 0,
        admins: usersRes.data.data?.totalAdmins || 0
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
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

  const statCards = [
    { label: 'Chủ đề', value: stats?.topics || 0, icon: '📚', color: 'blue', link: '/admin/topics' },
    { label: 'Bài học', value: stats?.lessons || 0, icon: '📖', color: 'green', link: '/admin/lessons' },
    { label: 'Ngân hàng Câu hỏi', value: stats?.exercises || 0, icon: '❓', color: 'purple', link: '/admin/exercises' },
    { label: 'Quiz', value: stats?.quizzes || 0, icon: '📝', color: 'orange', link: '/admin/quizzes' },
    { label: 'Người dùng', value: stats?.users || 0, icon: '👥', color: 'indigo', link: '/admin/users' },
    { label: 'Học sinh', value: stats?.students || 0, icon: '🎓', color: 'teal', link: '/admin/users?role=student' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Tổng quan hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/topics"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-semibold mb-2">📚 Quản lý Chủ đề</h3>
            <p className="text-sm text-gray-600">Tạo, sửa, xóa chủ đề</p>
          </Link>
          <Link
            to="/admin/lessons"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-semibold mb-2">📖 Quản lý Bài học</h3>
            <p className="text-sm text-gray-600">Tạo, sửa bài học và upload nội dung</p>
          </Link>
          <Link
            to="/admin/exercises"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-semibold mb-2">❓ Ngân hàng Câu hỏi</h3>
            <p className="text-sm text-gray-600">Xem và quản lý tất cả câu hỏi theo chủ đề/bài/mức độ</p>
          </Link>
          <Link
            to="/admin/quizzes"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-semibold mb-2">📝 Quản lý Quiz</h3>
            <p className="text-sm text-gray-600">Tạo và quản lý bài kiểm tra</p>
          </Link>
          <Link
            to="/admin/users"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-semibold mb-2">👥 Quản lý Người dùng</h3>
            <p className="text-sm text-gray-600">Xem và quản lý tài khoản người dùng</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

