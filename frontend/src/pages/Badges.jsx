import { useEffect, useState } from 'react';
import api from '../utils/api';

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get('/badges/user');
      setBadges(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách huy hiệu');
      setLoading(false);
    }
  };

  const handleCheckBadges = async () => {
    try {
      const response = await api.post('/badges/check');
      if (response.data.newlyEarned && response.data.newlyEarned.length > 0) {
        alert(`🎉 Chúc mừng! Bạn đã nhận được ${response.data.count} huy hiệu mới!`);
        fetchBadges(); // Refresh list
      } else {
        alert('Bạn chưa đạt được huy hiệu mới nào');
      }
    } catch (err) {
      console.error('Error checking badges:', err);
      alert('Có lỗi xảy ra khi kiểm tra huy hiệu');
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const notEarnedBadges = badges.filter(b => !b.earned);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500 border-yellow-300';
      case 'epic':
        return 'from-purple-400 to-pink-500 border-purple-300';
      case 'rare':
        return 'from-blue-400 to-cyan-500 border-blue-300';
      default:
        return 'from-gray-300 to-gray-400 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Huy hiệu</h1>
          <p className="text-gray-600">
            Bạn đã đạt được {earnedBadges.length} / {badges.length} huy hiệu
          </p>
        </div>
        <button
          onClick={handleCheckBadges}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Kiểm tra huy hiệu mới
        </button>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Huy hiệu đã đạt được</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {earnedBadges.map((badge) => (
              <div
                key={badge._id}
                className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-xl p-6 text-center border-2 shadow-lg transform hover:scale-105 transition-transform`}
              >
                <div className="text-6xl mb-3">{badge.icon}</div>
                <h3 className="font-bold text-white mb-2 text-sm">{badge.name}</h3>
                <p className="text-white text-xs opacity-90 mb-2">{badge.description}</p>
                {badge.earnedAt && (
                  <p className="text-white text-xs opacity-75">
                    Đạt được: {new Date(badge.earnedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not Earned Badges */}
      {notEarnedBadges.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Huy hiệu chưa đạt được</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {notEarnedBadges.map((badge) => (
              <div
                key={badge._id}
                className="bg-gray-100 rounded-xl p-6 text-center border-2 border-gray-200 opacity-60"
              >
                <div className="text-6xl mb-3 grayscale">{badge.icon}</div>
                <h3 className="font-bold text-gray-600 mb-2 text-sm">{badge.name}</h3>
                <p className="text-gray-500 text-xs">{badge.description}</p>
                {badge.condition && (
                  <p className="text-gray-400 text-xs mt-2">
                    Điều kiện: {getConditionText(badge.condition)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">Chưa có huy hiệu nào</p>
        </div>
      )}
    </div>
  );
};

// Helper function to format condition text
const getConditionText = (condition) => {
  if (!condition) return '';
  
  switch (condition.type) {
    case 'exercises_completed':
      return `Hoàn thành ${condition.value} bài tập`;
    case 'quiz_score':
      return `Đạt ${condition.value}% trong quiz${condition.timeLimit ? ` (trong ${condition.timeLimit} phút)` : ''}`;
    case 'lessons_completed':
      return `Hoàn thành ${condition.value} bài học`;
    case 'streak':
      return `Học liên tiếp ${condition.value} ngày`;
    default:
      return 'Điều kiện đặc biệt';
  }
};

export default Badges;

