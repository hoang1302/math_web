import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Exam = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopics();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quizzes');
      let quizzesData = response.data.data;
      
      // Filter by topic if selected
      if (selectedTopic) {
        quizzesData = quizzesData.filter(quiz => 
          quiz.topics && quiz.topics.some(topic => 
            (typeof topic === 'object' ? topic._id : topic) === selectedTopic
          )
        );
      }
      
      setQuizzes(quizzesData);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách bài luyện tập');
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 Bài luyện tập lớn</h1>
        <p className="text-gray-600">Chọn bài luyện tập lớn theo từng chủ đề để làm bài</p>
      </div>

      {/* Filter by Topic */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Lọc theo chủ đề:
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedTopic('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTopic === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {topics.map((topic) => (
            <button
              key={topic._id}
              onClick={() => setSelectedTopic(topic._id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTopic === topic._id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {topic.icon} {topic.title}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <Link
            key={quiz._id}
            to={`/quiz/${quiz._id}`}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow group border-2 border-purple-100 hover:border-purple-300"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold group-hover:text-purple-700 transition-colors">
                {quiz.title}
              </h3>
              <span className="text-2xl">📝</span>
            </div>
            {quiz.description && (
              <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
            )}
            {quiz.topics && quiz.topics.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Chủ đề:</p>
                <div className="flex flex-wrap gap-2">
                  {quiz.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                    >
                      {typeof topic === 'object' ? topic.title : 'Chủ đề'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
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
            <div className="mt-4 flex items-center text-purple-600 font-medium">
              Bắt đầu làm bài luyện tập
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-600">
            {selectedTopic 
              ? 'Chưa có bài luyện tập nào cho chủ đề này' 
              : 'Chưa có bài luyện tập nào'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Exam;

