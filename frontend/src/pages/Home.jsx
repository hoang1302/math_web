import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';

function Home() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waveAnimation, setWaveAnimation] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }

    // Wave animation
    const interval = setInterval(() => {
      setWaveAnimation(true);
      setTimeout(() => setWaveAnimation(false), 600);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const statsResponse = await api.get('/progress/stats');
      setStats(statsResponse.data.data);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const overview = stats?.overview || {};
  const completionPercentage = overview?.completionPercentage || 0;
  const completedLessons = overview?.completedLessons || 0;
  const totalLessons = overview?.totalLessons || 13;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // Mock data for leaderboard
  const leaderboard = [
    { rank: 1, name: 'Minh', points: 850, medal: '🥇' },
    { rank: 2, name: 'Hoa', points: 720, medal: '🥈' },
    { rank: 3, name: user?.username || 'Bạn', points: 650, medal: '🥉' },
  ];

  return (
    <div className="relative min-h-screen pb-8 overflow-hidden">
      {/* Soft floating blobs for subtle animation */}
      <motion.div
        aria-hidden
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: [0.9, 1.05, 0.95], opacity: 0.35, y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        className="absolute -left-10 -top-16 w-64 h-64 bg-blue-300/40 blur-3xl rounded-full"
      />
      <motion.div
        aria-hidden
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: [1, 1.08, 0.92], opacity: 0.3, y: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-16 top-10 w-72 h-72 bg-orange-200/50 blur-3xl rounded-full"
      />

      <div className="relative z-1 max-w-7xl mx-auto px-4">
        {/* Main content card to contrast with background */}
        <div className="mt-6 space-y-4">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
              Hế lô! Cùng học nhé {user?.profile?.fullName || user?.username || 'Bạn'}{' '}
              <motion.span
                animate={waveAnimation ? { rotate: [0, 20, -20, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                👋
              </motion.span>
            </h2>
          </motion.div>

          {/* Thanh tiến độ (giữ như ban đầu, không khung) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-6xl w-full"
          >
            <div className="flex items-center justify-between text-sm font-semibold text-gray-900 drop-shadow-[0_2px_6px_rgba(255,255,255,0.9)] mb-2 px-1">
              <span>Tiến độ học tập</span>
              <span className="text-gray-900 font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/90 overflow-hidden shadow-lg">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            <div className="text-xs font-semibold text-gray-900 drop-shadow-[0_2px_6px_rgba(255,255,255,0.9)] mt-2 px-1">
              {completedLessons}/{totalLessons} bài học
            </div>
          </motion.div>
        </div>

        {/* Enhanced Action Cards - Larger */}
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto mt-8">
          {/* Học bài Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.08, y: -6 }}
            className="relative w-full"
          >
            <Link
              to="/topics"
              className="block card-study-bg rounded-3xl shadow-2xl text-center transform transition-all hover:shadow-3xl border-4 border-blue-400 relative overflow-hidden aspect-video"
            >
              {/* Overlay nhẹ để text dễ đọc hơn */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-3xl"></div>
              {completedLessons < totalLessons && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-full text-base z-20"
                >
                  NEW
                </motion.span>
              )}
            </Link>
          </motion.div>

          {/* Thi Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.08, y: -6 }}
            className="relative w-full"
          >
            <Link
              to="/quiz"
              className="block card-quiz-bg rounded-3xl shadow-2xl text-center transform transition-all hover:shadow-3xl border-4 border-orange-400 relative overflow-hidden aspect-video"
            >
              {/* Overlay nhẹ để text dễ đọc hơn */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-700/20 rounded-3xl"></div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Home;
