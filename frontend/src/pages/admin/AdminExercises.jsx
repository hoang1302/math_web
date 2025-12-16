import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminExercises = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [formData, setFormData] = useState({
    lessonId: lessonId || '',
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    points: 1
  });

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
      fetchExercises();
      setFormData(prev => ({ ...prev, lessonId }));
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await api.get(`/lessons/${lessonId}`);
      setLesson(response.data.data);
    } catch (err) {
      console.error('Error fetching lesson:', err);
    }
  };

  const fetchExercises = async () => {
    try {
      const response = await api.get(`/exercises?lessonId=${lessonId}`);
      setExercises(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      // Process options for multiple-choice
      if (submitData.type === 'multiple-choice') {
        submitData.options = submitData.options.filter(opt => opt.trim() !== '');
        if (submitData.options.length < 2) {
          alert('Cần ít nhất 2 lựa chọn cho câu hỏi trắc nghiệm');
          return;
        }
      } else {
        submitData.options = [];
      }

      if (editingExercise) {
        await api.put(`/exercises/${editingExercise._id}`, submitData);
      } else {
        await api.post('/exercises', submitData);
      }
      
      await fetchExercises();
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    const options = exercise.options || ['', '', '', ''];
    while (options.length < 4) options.push('');
    
    setFormData({
      lessonId: exercise.lessonId?._id || exercise.lessonId || lessonId,
      type: exercise.type,
      question: exercise.question,
      options: options.slice(0, 4),
      correctAnswer: String(exercise.correctAnswer || ''),
      explanation: exercise.explanation || '',
      difficulty: exercise.difficulty,
      points: exercise.points || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    
    try {
      await api.delete(`/exercises/${id}`);
      await fetchExercises();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const resetForm = () => {
    setFormData({
      lessonId: lessonId || '',
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      points: 1
    });
    setEditingExercise(null);
  };

  const handleImportFromSheets = async () => {
    if (!importUrl.trim()) {
      alert('Vui lòng nhập URL Google Sheets');
      return;
    }

    setImportLoading(true);
    try {
      // Step 1: Fetch CSV from Google Sheets
      const fetchResponse = await api.post('/import/fetch-sheets', { url: importUrl });
      const csvData = fetchResponse.data.data.csvData;

      // Step 2: Parse and preview
      const parseResponse = await api.post('/import/questions', {
        csvData,
        lessonId
      });

      if (parseResponse.data.success) {
        setPreviewQuestions(parseResponse.data.data.questions);
        setShowImportModal(false);
        setShowPreviewModal(true);
      } else {
        alert(parseResponse.data.message || 'Có lỗi xảy ra khi import');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi import từ Google Sheets');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      // Create all questions
      const promises = previewQuestions.map(question =>
        api.post('/exercises', question)
      );

      await Promise.all(promises);
      alert(`Đã import thành công ${previewQuestions.length} câu hỏi!`);
      setShowPreviewModal(false);
      setPreviewQuestions([]);
      setImportUrl('');
      await fetchExercises();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu câu hỏi');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (!lessonId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Vui lòng chọn bài học từ trang Quản lý Bài học</p>
        <button
          onClick={() => navigate('/admin/lessons')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Quay lại Quản lý Bài học
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/lessons')}
            className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Câu hỏi luyện tập - {lesson?.title}
          </h1>
          <p className="text-gray-600">Quản lý câu hỏi luyện tập cho bài học này</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Import từ Google Sheets
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Tạo câu hỏi mới
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Câu hỏi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ khó</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exercises.map((exercise) => (
              <tr key={exercise._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                  <div className="truncate" dangerouslySetInnerHTML={{ __html: exercise.question }} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {exercise.type === 'multiple-choice' ? 'Trắc nghiệm' : 
                   exercise.type === 'fill-blank' ? 'Điền khuyết' : 'Tự luận'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    exercise.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {exercise.difficulty === 'easy' ? 'Dễ' : 
                     exercise.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{exercise.points || 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(exercise)}
                    className="text-primary-600 hover:text-primary-700 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(exercise._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exercises.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingExercise ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-3 gap-4">
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
                  {editingExercise ? 'Cập nhật' : 'Tạo mới'}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Import từ Google Sheets</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Google Sheets *
                </label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Lưu ý: Google Sheets phải được chia sẻ công khai hoặc có quyền xem
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cấu trúc: STT | Độ khó | Điểm | Câu hỏi | Đáp án A | Đáp án B | Đáp án C | Đáp án D | Đáp án đúng | Giải thích
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleImportFromSheets}
                  disabled={importLoading || !importUrl.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? 'Đang tải...' : 'Tải và Preview'}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportUrl('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Preview - {previewQuestions.length} câu hỏi
            </h2>
            <div className="space-y-4 mb-6">
              {previewQuestions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
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
                      <span className="text-xs text-gray-500">{question.points} điểm</span>
                    </div>
                  </div>
                  <p className="font-medium mb-3">{question.question}</p>
                  <div className="space-y-2">
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
                  {question.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Giải thích:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmImport}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Xác nhận và Import ({previewQuestions.length} câu hỏi)
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewQuestions([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExercises;

