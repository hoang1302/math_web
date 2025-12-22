import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const QuizList = () => {
  const [topics, setTopics] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopicId) {
      fetchQuizzes(selectedTopicId);
    } else {
      fetchQuizzes();
    }
  }, [selectedTopicId]);

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

  const fetchQuizzes = async (topicId = null) => {
    try {
      setLoading(true);
      const url = topicId ? `/quizzes?topicId=${topicId}` : '/quizzes';
      const response = await api.get(url);
      setQuizzes(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách quiz');
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Luyện tập</h1>
        <p className="text-gray-600">Chọn chủ đề và quiz để bắt đầu làm bài luyện tập</p>
      </div>

      {/* Topic Selection */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn chủ đề (tùy chọn)
        </label>
        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="w-full md:w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((topic) => (
            <option key={topic._id} value={topic._id}>
              {topic.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <Link
            key={quiz._id}
            to={`/quiz/${quiz._id}`}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold group-hover:text-primary-700 transition-colors">
                {quiz.title}
              </h3>
            </div>
            {quiz.description && (
              <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>📝</span>
                <span>{quiz.totalQuestions || 0} câu hỏi</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⏱️</span>
                <span>{quiz.timeLimit} phút</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⭐</span>
                <span>{quiz.totalPoints || 0} điểm</span>
              </div>
            </div>
            <div className="mt-4 flex items-center text-primary-600 font-medium">
              Bắt đầu làm bài
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">Chưa có quiz nào</p>
        </div>
      )}
    </div>
  );
};

export default QuizList;

