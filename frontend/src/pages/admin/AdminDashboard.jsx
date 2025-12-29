import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../utils/api';
import { useAdminGrade } from '../../context/AdminGradeContext';

const AdminDashboard = () => {
  const { selectedGrade } = useAdminGrade();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedGrade]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [topicsRes, lessonsRes, exercisesRes, quizzesRes, usersRes] = await Promise.all([
        api.get('/topics'),
        api.get('/lessons'),
        api.get('/exercises'),
        api.get('/quizzes'),
        api.get('/users/stats')
      ]);

      const allTopics = topicsRes.data.data || [];
      const allLessons = lessonsRes.data.data || [];
      const allExercises = exercisesRes.data.data || [];
      const allQuizzes = quizzesRes.data.data || [];
      const usersData = usersRes.data.data || {};

      // Filter data by selected grade
      const topicsData = allTopics.filter(t => t.grade === selectedGrade);
      const topicIds = topicsData.map(t => t._id);
      const lessonsData = allLessons.filter(l => {
        const topicId = l.topicId?._id || l.topicId;
        return topicIds.includes(topicId);
      });
      const lessonIds = lessonsData.map(l => l._id);
      const exercisesData = Array.isArray(allExercises) 
        ? allExercises.filter(e => {
            const lessonId = e.lessonId?._id || e.lessonId;
            return lessonIds.includes(lessonId);
          })
        : [];
      const quizzesData = allQuizzes.filter(q => q.grade === selectedGrade);

      // Tính toán thống kê theo chủ đề của lớp đã chọn
      const topicStats = topicsData.map(topic => {
        const lessonsInTopic = lessonsData.filter(l => {
          const topicId = l.topicId?._id || l.topicId;
          return topicId === topic._id;
        });
        return {
          name: topic.title,
          lessons: lessonsInTopic.length,
          exercises: 0
        };
      });

      setStats({
        topics: topicsData.length,
        lessons: lessonsData.length,
        exercises: exercisesData.length,
        quizzes: quizzesData.length,
        users: usersData.totalUsers || 0,
        students: usersData.totalStudents || 0,
        admins: usersData.totalAdmins || 0,
        topicStats
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

  // Dữ liệu cho biểu đồ cột - Tổng quan hệ thống
  const contentData = [
    { name: 'Chủ đề', value: stats?.topics || 0, color: '#4FACFE' },
    { name: 'Bài học', value: stats?.lessons || 0, color: '#00C853' },
    { name: 'Câu hỏi', value: stats?.exercises || 0, color: '#9C27B0' },
    { name: 'Quiz', value: stats?.quizzes || 0, color: '#FF9800' },
  ];

  // Dữ liệu cho biểu đồ tròn - Phân bố người dùng
  const userDistributionData = [
    { name: 'Học sinh', value: stats?.students || 0, color: '#4FACFE' },
    { name: 'Admin', value: stats?.admins || 0, color: '#FF9800' },
  ];

  // Dữ liệu cho biểu đồ tròn - Hoạt động người dùng
  const userActivityData = [
    { name: 'Đã hoạt động', value: stats?.activeUsers || 0, color: '#00C853' },
    { name: 'Chưa hoạt động', value: (stats?.users || 0) - (stats?.activeUsers || 0), color: '#E0E0E0' },
  ];

  // Dữ liệu cho biểu đồ cột - Bài học theo chủ đề
  const topicLessonsData = (stats?.topicStats || []).map(item => ({
    name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
    'Số bài học': item.lessons
  }));

  const COLORS = ['#4FACFE', '#00C853', '#9C27B0', '#FF9800', '#F44336', '#00BCD4'];

  const statCards = [
    { 
      label: 'Tổng người dùng', 
      value: stats?.users || 0, 
      icon: '👥', 
      color: 'from-blue-500 to-blue-600',
      link: '/admin/users'
    },
    { 
      label: 'Học sinh', 
      value: stats?.students || 0, 
      icon: '🎓', 
      color: 'from-green-500 to-green-600',
      link: '/admin/users?role=student'
    },
    { 
      label: 'Chủ đề', 
      value: stats?.topics || 0, 
      icon: '📚', 
      color: 'from-purple-500 to-purple-600',
      link: '/admin/topics'
    },
    { 
      label: 'Bài học', 
      value: stats?.lessons || 0, 
      icon: '📖', 
      color: 'from-teal-500 to-teal-600',
      link: '/admin/lessons'
    },
    { 
      label: 'Câu hỏi', 
      value: stats?.exercises || 0, 
      icon: '❓', 
      color: 'from-pink-500 to-pink-600',
      link: '/admin/exercises'
    },
    { 
      label: 'Quiz', 
      value: stats?.quizzes || 0, 
      icon: '📝', 
      color: 'from-indigo-500 to-indigo-600',
      link: '/admin/quizzes'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <span className="px-4 py-2 bg-primary-600 text-white rounded-full text-lg font-semibold">
            Lớp {selectedGrade}
          </span>
        </div>
        <p className="text-gray-600">Tổng quan hệ thống và thống kê cho Lớp {selectedGrade}</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ cột - Tổng quan nội dung */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Tổng quan nội dung hệ thống</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4FACFE" radius={[8, 8, 0, 0]}>
                {contentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ cột - Bài học theo chủ đề */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Số bài học theo chủ đề</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicLessonsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Số bài học" fill="#4FACFE" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quản lý hệ thống</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/topics"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold text-sm">Chủ đề</div>
          </Link>
          <Link
            to="/admin/lessons"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-semibold text-sm">Bài học</div>
          </Link>
          <Link
            to="/admin/exercises"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-3xl mb-2">❓</div>
            <div className="font-semibold text-sm">Câu hỏi</div>
          </Link>
          <Link
            to="/admin/quizzes"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold text-sm">Quiz</div>
          </Link>
          <Link
            to="/admin/users"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-semibold text-sm">Người dùng</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
