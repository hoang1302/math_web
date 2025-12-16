import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getTopicIcon = (topic) => {
    if (!topic) return '📚';

    const order = topic.order || 0;
    const title = (topic.title || '').toLowerCase();

    // Map theo số thứ tự chủ đề
    switch (order) {
      case 1:
        return '🔢'; // Số và phép tính cơ bản
      case 2:
        return '➗'; // Phân số / chia
      case 3:
        return '📏'; // Hình học, đo lường
      case 4:
        return '📐'; // Góc, diện tích
      case 5:
        return '📊'; // Bảng, biểu đồ
      case 6:
        return '⏱️'; // Thời gian
      case 7:
        return '💰'; // Tiền, bài toán có lời văn
      case 8:
        return '🧮'; // Ôn tập tổng hợp
      default:
        break;
    }

    // Nếu không khớp order, đoán icon theo tiêu đề
    if (title.includes('phân số') || title.includes('chia')) return '➗';
    if (title.includes('hình') || title.includes('diện tích') || title.includes('chu vi')) return '📐';
    if (title.includes('số') || title.includes('tự nhiên')) return '🔢';
    if (title.includes('biểu đồ') || title.includes('bảng')) return '📊';
    if (title.includes('thời gian') || title.includes('ngày')) return '⏱️';
    if (title.includes('tiền') || title.includes('mua') || title.includes('bán')) return '💰';

    return '📚';
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách chủ đề');
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Danh sách chủ đề</h1>
        <p className="text-gray-600">Chọn chủ đề để bắt đầu học</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Link
            key={topic._id}
            to={`/lessons?topicId=${topic._id}`}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">
                {getTopicIcon(topic)}
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Chủ đề {topic.order}
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-700 transition-colors">
              {topic.title}
            </h3>
            {/* Hiển thị nội dung ngắn gọn về chủ đề */}
            {topic.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {topic.description}
              </p>
            )}
            {topic.lessonsCount !== undefined && (
              <p className="text-sm text-gray-500 mb-2">
                {topic.lessonsCount} bài học
              </p>
            )}
            <div className="mt-4 flex items-center text-primary-600 font-medium">
              Bắt đầu học
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">Chưa có chủ đề nào</p>
        </div>
      )}
    </div>
  );
};

export default Topics;

