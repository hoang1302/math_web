import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const Lessons = () => {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topicId');
  
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
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

  useEffect(() => {
    if (topicId) {
      fetchLessons(topicId);
    } else if (topics.length > 0) {
      fetchLessons(topics[0]._id);
    }
  }, [topicId, topics]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      const topicsData = response.data.data;
      setTopics(topicsData);
      
      if (topicId) {
        const topic = topicsData.find(t => t._id === topicId);
        setSelectedTopic(topic || topicsData[0]);
      } else if (topicsData.length > 0) {
        setSelectedTopic(topicsData[0]);
      }
    } catch (err) {
      setError('Không thể tải danh sách chủ đề');
      setLoading(false);
    }
  };

  const fetchLessons = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/lessons?topicId=${id}`);
      setLessons(response.data.data);
      
      const topic = topics.find(t => t._id === id);
      if (topic) setSelectedTopic(topic);
      
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách bài học');
      setLoading(false);
    }
  };

  const handleTopicChange = (topicId) => {
    fetchLessons(topicId);
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Topics (Hidden on mobile, shown on desktop on the left) */}
      <div className="hidden lg:block lg:col-span-1 order-1">
        <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
          <h3 className="font-semibold text-lg mb-4">Chủ đề</h3>
          <div className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic._id}
                onClick={() => handleTopicChange(topic._id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedTopic?._id === topic._id
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{getTopicIcon(topic)}</span>
                  <span className="text-sm">{topic.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Lessons */}
      <div className="lg:col-span-3 order-2">
        {selectedTopic && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {getTopicIcon(selectedTopic)} {selectedTopic.title}
            </h1>
            <p className="text-gray-600">
              {lessons.length} bài học
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <Link
              key={lesson._id}
              to={`/lessons/${lesson._id}`}
              className="block bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                      Bài {lesson.order}
                    </span>
                    {lesson.estimatedTime && (
                      <span className="text-sm text-gray-500">
                        ⏱️ {lesson.estimatedTime} phút
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-700 transition-colors">
                    {lesson.title}
                  </h3>
                  {lesson.exercisesCount !== undefined && (
                    <p className="text-sm text-gray-500">
                      {lesson.exercisesCount} bài tập
                    </p>
                  )}
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {lessons.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600">Chưa có bài học nào trong chủ đề này</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lessons;

