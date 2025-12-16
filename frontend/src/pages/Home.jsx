import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

function Home() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waveAnimation, setWaveAnimation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [studiedToday, setStudiedToday] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

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
      const streakData = statsResponse.data.data?.overview?.streak;
      setStreak(streakData?.current || 0);
      setStudiedToday(!!streakData?.studiedToday);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  // Show quick congrats when a study session turns today's flame red
  useEffect(() => {
    if (studiedToday) {
      const todayKey = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem('streakCongratsDate');
      if (lastShown !== todayKey) {
        setShowCongrats(true);
        localStorage.setItem('streakCongratsDate', todayKey);
      }
    }
  }, [studiedToday]);

  if (authLoading || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
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

  // Progress bar color based on percentage
  const getProgressColor = () => {
    if (completionPercentage < 25) return 'from-green-400 to-green-500';
    if (completionPercentage < 50) return 'from-green-400 via-yellow-400 to-yellow-500';
    if (completionPercentage < 75) return 'from-yellow-400 via-orange-400 to-orange-500';
    return 'from-orange-400 via-red-400 to-red-500';
  };

  // Mock data for leaderboard
  const leaderboard = [
    { rank: 1, name: 'Minh', points: 850, medal: '🥇' },
    { rank: 2, name: 'Hoa', points: 720, medal: '🥈' },
    { rank: 3, name: user?.username || 'Bạn', points: 650, medal: '🥉' },
  ];

  const flameColor = studiedToday ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.65)]' : 'text-gray-400';

  const hoursLeftToday = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
  };

  const closeCongrats = () => setShowCongrats(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 pb-8 overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Greeting + compact progress */}
        <div className="mb-6 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-4"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-800">
              {getGreeting()}, {user?.username || 'Bạn'}!{' '}
              <motion.span
                animate={waveAnimation ? { rotate: [0, 20, -20, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                👋
              </motion.span>
            </h2>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border ${
                studiedToday ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white border-red-300' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <motion.span
                animate={{ scale: studiedToday ? [1, 1.2, 1] : 1, rotate: studiedToday ? [0, -3, 3, 0] : 0 }}
                transition={{ repeat: studiedToday ? Infinity : 0, duration: 1 }}
                className={`text-2xl ${flameColor}`}
              >
                🔥
              </motion.span>
              <span className="font-heading font-bold">Streak: {streak} ngày</span>
            </motion.div>
          </motion.div>

          {/* Thin progress strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-6xl w-full"
          >
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2 px-1">
              <span>Tiến độ học tập</span>
              <span className="text-primary-700">{completionPercentage}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
            <div className="text-xs font-semibold text-gray-600 mt-2 px-1">{completedLessons}/{totalLessons} bài học</div>
          </motion.div>
        </div>

        {/* Enhanced Action Cards - Larger */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Học bài Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.08, y: -6 }}
            className="relative"
          >
            <Link
              to="/topics"
              className="block bg-gradient-to-br from-[#3B82F6] to-blue-600 rounded-3xl shadow-2xl p-12 text-center transform transition-all hover:shadow-3xl border-4 border-blue-400"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="text-9xl mb-8"
              >
                📚
              </motion.div>
              <h3 className="text-5xl font-heading font-bold tracking-tight text-white mb-4 drop-shadow-lg">
                Học bài
              </h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-white text-blue-700 font-heading font-semibold tracking-normal px-10 py-4 rounded-xl shadow-lg text-lg md:text-xl"
              >
                Bắt đầu học →
              </motion.div>
              {completedLessons < totalLessons && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-full text-base"
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
            className="relative"
          >
            <Link
              to="/quiz"
              className="block bg-gradient-to-br from-[#F59E0B] to-orange-500 rounded-3xl shadow-2xl p-12 text-center transform transition-all hover:shadow-3xl border-4 border-orange-400"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -5, 5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="text-9xl mb-8"
              >
                ✏️
              </motion.div>
              <h3 className="text-5xl font-heading font-bold tracking-tight text-white mb-4 drop-shadow-lg">
                Thi
              </h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-block bg-white text-orange-700 font-heading font-semibold tracking-normal px-10 py-4 rounded-xl shadow-lg text-lg md:text-xl"
              >
                Làm bài thi →
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Congrats modal when turning the flame red */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            key="streak-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCongrats}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-2xl px-8 py-10 max-w-md w-full text-center border border-orange-200 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#fb923c,_transparent_35%)]"
                aria-hidden
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="text-6xl mb-4"
              >
                🔥
              </motion.div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500 font-semibold mb-2">Giữ lửa!</p>
              <h3 className="text-4xl font-heading font-bold text-gray-800 mb-3">{streak} ngày streak</h3>
              <p className="text-gray-600 mb-6">
                Bạn vừa duy trì streak hôm nay. Còn {hoursLeftToday()} giờ nữa là hết ngày, tiếp tục nhé!
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={closeCongrats}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold shadow-lg hover:bg-orange-600 transition-colors"
                >
                  Tiếp tục
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
