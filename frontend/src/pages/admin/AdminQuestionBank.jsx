import { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminQuestionBank = () => {
  const [exercises, setExercises] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [selectedAiQuestions, setSelectedAiQuestions] = useState([]);
  const [aiFormData, setAiFormData] = useState({
    topic: '',
    difficulty: 'medium',
    type: 'multiple-choice',
    count: 5
  });
  const [formData, setFormData] = useState({
    lessonId: '',
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    points: 1
  });
  
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
        includeAnswers: 'true',
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
        ...(selectedType && { type: selectedType })
      };
      
      const response = await api.get('/exercises', { params });
      let exercisesData = response.data.data || [];
      
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

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      if (submitData.type === 'multiple-choice') {
        submitData.options = submitData.options.filter(opt => opt.trim() !== '');
        if (submitData.options.length < 2) {
          alert('Cần ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm');
          return;
        }
      } else {
        submitData.options = [];
      }

      if (!submitData.lessonId) {
        alert('Vui lòng chọn bài học');
        return;
      }

      await api.post('/exercises', submitData);
      await fetchExercises();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      lessonId: '',
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      points: 1
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedExercises(exercises.map(ex => ex._id));
    } else {
      setSelectedExercises([]);
    }
  };

  const handleSelectExercise = (exerciseId) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedExercises.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để xóa');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedExercises.length} câu hỏi đã chọn?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedExercises.map(id => api.delete(`/exercises/${id}`))
      );
      setSelectedExercises([]);
      await fetchExercises();
      alert(`Đã xóa thành công ${selectedExercises.length} câu hỏi`);
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa câu hỏi');
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ngân hàng Câu hỏi</h1>
          <p className="text-gray-600">Quản lý và xem tất cả câu hỏi trong hệ thống</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setAiFormData({
                topic: '',
                difficulty: 'medium',
                type: 'multiple-choice',
                count: 5
              });
              setShowAIModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🤖 Tạo bằng AI
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Tạo câu hỏi mới
          </button>
        </div>
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

      {/* Bulk Actions */}
      {selectedExercises.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            Đã chọn {selectedExercises.length} câu hỏi
          </span>
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Xóa đã chọn ({selectedExercises.length})
          </button>
        </div>
      )}

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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={exercises.length > 0 && selectedExercises.length === exercises.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
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
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy câu hỏi nào
                  </td>
                </tr>
              ) : (
                exercises.map((exercise) => (
                  <tr key={exercise._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedExercises.includes(exercise._id)}
                        onChange={() => handleSelectExercise(exercise._id)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </td>
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

      {/* Create Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Tạo câu hỏi mới</h2>
            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ đề *
                </label>
                <select
                  required
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    setFormData({ ...formData, lessonId: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Chọn chủ đề</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bài học *
                </label>
                <select
                  required
                  value={formData.lessonId}
                  onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                  disabled={!selectedTopic}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      Bài {lesson.order}: {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại câu hỏi *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({
                      ...formData,
                      type: newType,
                      options: newType === 'multiple-choice' ? ['', '', '', ''] : [],
                      correctAnswer: ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ LaTeX) *
                </label>
                <textarea
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập câu hỏi..."
                />
              </div>

              {formData.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Các lựa chọn *
                  </label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={formData.correctAnswer === option}
                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                        className="mr-2"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Lựa chọn ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    Chọn radio button để đánh dấu đáp án đúng
                  </p>
                </div>
              )}

              {(formData.type === 'fill-blank' || formData.type === 'essay') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đáp án đúng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Nhập đáp án đúng..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thích chi tiết
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Giải thích tại sao đáp án này đúng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ *
                  </label>
                  <select
                    required
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điểm
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Tạo mới
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">🤖 Tạo câu hỏi bằng AI</h2>
            
            {aiGeneratedQuestions.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chủ đề / Nội dung *
                  </label>
                  <input
                    type="text"
                    required
                    value={aiFormData.topic}
                    onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                    placeholder="Ví dụ: Phép cộng, Phép trừ, Phân số..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mức độ
                    </label>
                    <select
                      value={aiFormData.difficulty}
                      onChange={(e) => setAiFormData({ ...aiFormData, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại câu hỏi
                    </label>
                    <select
                      value={aiFormData.type}
                      onChange={(e) => setAiFormData({ ...aiFormData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="multiple-choice">Trắc nghiệm</option>
                      <option value="fill-blank">Điền khuyết</option>
                      <option value="essay">Tự luận</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={aiFormData.count}
                      onChange={(e) => setAiFormData({ ...aiFormData, count: parseInt(e.target.value) || 5 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (!aiFormData.topic.trim()) {
                        alert('Vui lòng nhập chủ đề');
                        return;
                      }
                      try {
                        setAiLoading(true);
                        const response = await api.post('/ai/generate-exercises', {
                          topic: aiFormData.topic,
                          difficulty: aiFormData.difficulty,
                          type: aiFormData.type,
                          count: parseInt(aiFormData.count)
                        });

                        if (response.data.success) {
                          setAiGeneratedQuestions(response.data.data);
                          setSelectedAiQuestions(response.data.data.map((_, index) => index));
                        } else {
                          alert(response.data.message || 'Có lỗi xảy ra khi tạo câu hỏi');
                        }
                      } catch (err) {
                        console.error('Error generating AI questions:', err);
                        alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo câu hỏi bằng AI');
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    disabled={aiLoading || !aiFormData.topic.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? 'Đang tạo...' : '🤖 Tạo câu hỏi'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiGeneratedQuestions([]);
                      setSelectedAiQuestions([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn bài học để lưu câu hỏi *
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      fetchLessons(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
                  >
                    <option value="">Chọn chủ đề</option>
                    {topics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  {selectedTopic && (
                    <select
                      value={formData.lessonId}
                      onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Chọn bài học</option>
                      {lessons.map((lesson) => (
                        <option key={lesson._id} value={lesson._id}>
                          Bài {lesson.order}: {lesson.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Đã tạo {aiGeneratedQuestions.length} câu hỏi. Chọn câu hỏi muốn lưu:
                  </p>
                  <button
                    onClick={() => {
                      setAiGeneratedQuestions([]);
                      setSelectedAiQuestions([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Tạo lại
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {aiGeneratedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 ${
                        selectedAiQuestions.includes(index)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAiQuestions.includes(index)}
                          onChange={() => {
                            setSelectedAiQuestions(prev =>
                              prev.includes(index)
                                ? prev.filter(i => i !== index)
                                : [...prev, index]
                            );
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium">
                              Câu {index + 1}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {question.difficulty === 'easy' ? 'Dễ' : 
                               question.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                            </span>
                          </div>
                          <p className="font-medium mb-3">{question.question}</p>
                          
                          {question.type === 'multiple-choice' && question.options && (
                            <div className="space-y-2 mb-3">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded ${
                                    option === question.correctAnswer
                                      ? 'bg-green-50 border-2 border-green-300'
                                      : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </span>
                                  {option === question.correctAnswer && (
                                    <span className="ml-2 text-green-600 font-semibold">✓ Đúng</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="mt-3 p-2 bg-blue-50 rounded">
                              <p className="text-sm text-gray-700">
                                <strong>Giải thích:</strong> {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (!formData.lessonId) {
                        alert('Vui lòng chọn bài học để lưu câu hỏi');
                        return;
                      }
                      if (selectedAiQuestions.length === 0) {
                        alert('Vui lòng chọn ít nhất một câu hỏi để lưu');
                        return;
                      }

                      try {
                        const questionsToSave = selectedAiQuestions.map(index => {
                          const question = aiGeneratedQuestions[index];
                          return {
                            ...question,
                            lessonId: formData.lessonId
                          };
                        });

                        const promises = questionsToSave.map(question =>
                          api.post('/exercises', question)
                        );

                        await Promise.all(promises);
                        alert(`Đã lưu thành công ${selectedAiQuestions.length} câu hỏi!`);
                        setShowAIModal(false);
                        setAiGeneratedQuestions([]);
                        setSelectedAiQuestions([]);
                        await fetchExercises();
                      } catch (err) {
                        alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu câu hỏi');
                      }
                    }}
                    disabled={selectedAiQuestions.length === 0 || !formData.lessonId}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu {selectedAiQuestions.length > 0 ? `${selectedAiQuestions.length} ` : ''}câu hỏi đã chọn
                  </button>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiGeneratedQuestions([]);
                      setSelectedAiQuestions([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionBank;
