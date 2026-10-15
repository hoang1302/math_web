import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAdminGrade } from '../../context/AdminGradeContext';

const AdminLessons = () => {
  const { selectedGrade } = useAdminGrade();
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [exerciseCounts, setExerciseCounts] = useState({});
  const [formData, setFormData] = useState({
    topicId: '',
    title: '',
    content: '',
    slides: [],
    order: ''
  });
  const [slideInput, setSlideInput] = useState('');

  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data || []);
      if (response.data.data?.length > 0 && !selectedTopicId) {
        setSelectedTopicId(response.data.data[0]._id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setLoading(false);
    }
  }, [selectedTopicId]);

  const fetchLessons = useCallback(async (topicId) => {
    try {
      const response = await api.get(`/lessons?topicId=${topicId}`);
      const lessonsData = response.data.data || [];
      setLessons(lessonsData);

      // Fetch exercise counts for each lesson
      const counts = {};
      await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const exercisesRes = await api.get(`/exercises?lessonId=${lesson._id}`);
            counts[lesson._id] = exercisesRes.data.data?.length || 0;
          } catch (err) {
            counts[lesson._id] = 0;
          }
        })
      );
      setExerciseCounts(counts);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson._id}`, formData);
      } else {
        await api.post('/lessons', formData);
      }
      await fetchLessons(selectedTopicId);
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      topicId: lesson.topicId?._id || lesson.topicId || selectedTopicId,
      title: lesson.title,
      content: lesson.content || '',
      slides: lesson.slides || [],
      order: lesson.order
    });
    setSlideInput('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;

    try {
      await api.delete(`/lessons/${id}`);
      await fetchLessons(selectedTopicId);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      topicId: selectedTopicId,
      title: '',
      content: '',
      slides: [],
      order: ''
    });
    setSlideInput('');
    setEditingLesson(null);
  };

  const handleAddSlide = () => {
    if (slideInput.trim()) {
      setFormData({
        ...formData,
        slides: [...formData.slides, slideInput.trim()]
      });
      setSlideInput('');
    }
  };

  const handleRemoveSlide = (index) => {
    setFormData({
      ...formData,
      slides: formData.slides.filter((_, i) => i !== index)
    });
  };

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (selectedTopicId) {
      fetchLessons(selectedTopicId);
    } else {
      setLessons([]);
    }
  }, [fetchLessons, selectedTopicId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Bài học</h1>
          <p className="text-gray-600">Tạo, sửa, xóa bài học và upload nội dung</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          disabled={!selectedTopicId}
        >
          + Tạo bài học mới
        </button>
      </div>

      {/* Topic Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn chủ đề (Lớp {selectedGrade})
        </label>
        <select
          value={selectedTopicId}
          onChange={(e) => setSelectedTopicId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">-- Chọn chủ đề --</option>
          {topics.filter(topic => topic.grade === selectedGrade).map((topic) => (
            <option key={topic._id} value={topic._id}>
              {topic.title}
            </option>
          ))}
        </select>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên bài học</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slides</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Câu hỏi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lessons.map((lesson) => (
              <tr key={lesson._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{lesson.order}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{lesson.title}</td>
                <td className="px-6 py-4 text-sm">
                  {lesson.slides && lesson.slides.length > 0 ? (
                    <span className="text-green-600 font-medium">📊 {lesson.slides.length} slide(s)</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {exerciseCounts[lesson._id] > 0 ? (
                    <span className="text-purple-600 font-medium">❓ {exerciseCounts[lesson._id]} câu</span>
                  ) : (
                    <span className="text-gray-400">Chưa có</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(lesson)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Sửa
                    </button>
                    <Link
                      to={`/admin/lessons/${lesson._id}/exercises`}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      ❓ Câu hỏi
                    </Link>
                    <button
                      onClick={() => handleDelete(lesson._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lessons.length === 0 && selectedTopicId && (
          <div className="text-center py-12 text-gray-500">
            Chưa có bài học nào trong chủ đề này
          </div>
        )}
        {!selectedTopicId && (
          <div className="text-center py-12 text-gray-500">
            Vui lòng chọn chủ đề để xem danh sách bài học
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingLesson ? 'Sửa bài học' : 'Tạo bài học mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ đề *
                </label>
                <select
                  required
                  value={formData.topicId}
                  onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Chọn chủ đề --</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên bài học *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Slides (Link bài giảng)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={slideInput}
                      onChange={(e) => setSlideInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSlide();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://docs.google.com/presentation/d/..."
                    />
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Thêm
                    </button>
                  </div>
                  {formData.slides.length > 0 && (
                    <div className="space-y-2">
                      {formData.slides.map((slide, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                            Slide {index + 1}: {slide}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Thêm link Google Slides để hiển thị bài giảng dạng slide. Có thể thêm nhiều slide.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung lý thuyết (hỗ trợ LaTeX) - Tùy chọn
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập nội dung lý thuyết bổ sung (nếu cần)..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nội dung text này sẽ hiển thị bên dưới slides (nếu có)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số thứ tự *
                </label>
                <input
                  type="number"
                  required
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingLesson ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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
    </div>
  );
};

export default AdminLessons;

