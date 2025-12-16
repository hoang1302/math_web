import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminQuestionBank = () => {
  const [exercises, setExercises] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTopics();
    fetchExercises();
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [selectedTopic, selectedLesson, selectedDifficulty, selectedType]);

  useEffect(() => {
    if (selectedTopic) {
      fetchLessons(selectedTopic);
    } else {
      setLessons([]);
      setSelectedLesson('');
    }
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchLessons = async (topicId) => {
    try {
      const response = await api.get(`/lessons?topicId=${topicId}`);
      setLessons(response.data.data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = {
        includeAnswers: 'true', // Admin can see answers
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
        ...(selectedType && { type: selectedType })
      };
      
      const response = await api.get('/exercises', { params });
      let exercisesData = response.data.data || [];
      
      // Filter by search term
      if (searchTerm) {
        exercisesData = exercisesData.filter(ex => 
          ex.question.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setExercises(exercisesData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Dễ' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Trung bình' },
      hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Khó' }
    };
    const badge = badges[difficulty] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const types = {
      'multiple-choice': 'Trắc nghiệm',
      'fill-blank': 'Điền khuyết',
      'essay': 'Tự luận'
    };
    return types[type] || type;
  };

  if (loading && exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ngân hàng Câu hỏi</h1>
        <p className="text-gray-600">Quản lý và xem tất cả câu hỏi trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo nội dung..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchExercises();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedLesson('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả chủ đề</option>
              {topics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bài học
            </label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              disabled={!selectedTopic}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value="">Tất cả bài học</option>
              {lessons.map((lesson) => (
                <option key={lesson._id} value={lesson._id}>
                  Bài {lesson.order}: {lesson.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức độ
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả mức độ</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại câu hỏi
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả loại</option>
              <option value="multiple-choice">Trắc nghiệm</option>
              <option value="fill-blank">Điền khuyết</option>
              <option value="essay">Tự luận</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exercises Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách câu hỏi</h2>
            <span className="text-sm text-gray-600">
              Tổng số: {exercises.length} câu hỏi
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Câu hỏi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chủ đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mức độ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exercises.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy câu hỏi nào
                  </td>
                </tr>
              ) : (
                exercises.map((exercise) => (
                  <tr key={exercise._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div 
                        className="truncate" 
                        dangerouslySetInnerHTML={{ __html: exercise.question.substring(0, 100) + (exercise.question.length > 100 ? '...' : '') }} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {exercise.lessonId?.topicId?.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {exercise.lessonId ? `Bài ${exercise.lessonId.order}: ${exercise.lessonId.title}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getTypeLabel(exercise.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getDifficultyBadge(exercise.difficulty)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{exercise.points || 1}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionBank;
