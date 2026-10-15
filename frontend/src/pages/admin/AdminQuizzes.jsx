import { useCallback, useEffect, useState } from 'react';
import api, { getBaseUrl } from '../../utils/api';
import { useAdminGrade } from '../../context/AdminGradeContext';

const AdminQuizzes = () => {
  const { selectedGrade } = useAdminGrade();
  const [quizzes, setQuizzes] = useState([]);
  const [, setTopics] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  // Question Bank Modal state
  const [bankExercises, setBankExercises] = useState([]);
  const [bankTopics, setBankTopics] = useState([]);
  const [bankLessons, setBankLessons] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedBankTopic, setSelectedBankTopic] = useState('');
  const [selectedBankLesson, setSelectedBankLesson] = useState('');
  const [selectedBankDifficulty, setSelectedBankDifficulty] = useState('');
  const [selectedBankType, setSelectedBankType] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [randomCount, setRandomCount] = useState(5);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    topics: [],
    questions: [],
    grade: 1
  });
  const [questionFormData, setQuestionFormData] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    points: 1,
    questionImage: '',
    questionImageFile: null
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setLoading(false);
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data.data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  }, []);

  const fetchAllExercises = useCallback(async () => {
    try {
      const response = await api.get('/exercises');
      setExercises(response.data.data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    }
  }, []);

  const fetchBankExercises = useCallback(async () => {
    try {
      setBankLoading(true);
      const params = {
        includeAnswers: 'true',
        ...(selectedBankTopic && { topicId: selectedBankTopic }),
        ...(selectedBankLesson && { lessonId: selectedBankLesson }),
        ...(selectedBankDifficulty && { difficulty: selectedBankDifficulty }),
        ...(selectedBankType && { type: selectedBankType })
      };

      const response = await api.get('/exercises', { params });
      setBankExercises(response.data.data || []);
      setBankLoading(false);
    } catch (err) {
      console.error('Error fetching bank exercises:', err);
      setBankLoading(false);
    }
  }, [selectedBankDifficulty, selectedBankLesson, selectedBankTopic, selectedBankType]);

  const fetchBankTopics = useCallback(async () => {
    try {
      const response = await api.get('/topics');
      setBankTopics(response.data.data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  }, []);

  const fetchBankLessons = useCallback(async (topicId) => {
    try {
      const response = await api.get(`/lessons?topicId=${topicId}`);
      setBankLessons(response.data.data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Normalize questions: convert objects to IDs, keep IDs as is
      const questionIds = formData.questions.map(q => {
        if (typeof q === 'string' || q._id) {
          return typeof q === 'string' ? q : q._id;
        }
        // If it's an object without _id, it's a new question that needs to be created
        // For now, we'll skip these or handle them separately
        return q;
      }).filter(q => q); // Remove any null/undefined

      const submitData = {
        title: formData.title,
        description: formData.description,
        timeLimit: formData.timeLimit,
        topics: formData.topics,
        questions: questionIds,
        grade: formData.grade
      };

      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz._id}`, submitData);
      } else {
        await api.post('/quizzes', submitData);
      }

      await fetchQuizzes();
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = async (quiz) => {
    setEditingQuiz(quiz);

    // Fetch full quiz data with populated questions
    try {
      const fullQuizResponse = await api.get(`/quizzes/${quiz._id}`);
      const fullQuiz = fullQuizResponse.data.data;

      setFormData({
        title: fullQuiz.title || quiz.title,
        description: fullQuiz.description || quiz.description || '',
        timeLimit: fullQuiz.timeLimit || quiz.timeLimit || 30,
        topics: fullQuiz.topics?.map(t => t._id || t) || quiz.topics?.map(t => t._id || t) || [],
        questions: fullQuiz.questions?.map(q => q._id || q) || quiz.questions || [],
        grade: fullQuiz.grade || quiz.grade || 5
      });

      // Fetch exercises to populate question details
      if (fullQuiz.questions && fullQuiz.questions.length > 0) {
        const questionIds = fullQuiz.questions.map(q => q._id || q);
        try {
          const exercisesResponse = await api.get('/exercises', {
            params: { includeAnswers: 'true' }
          });
          const allExercises = exercisesResponse.data.data || [];
          // Filter exercises that are in this quiz
          const quizExercises = allExercises.filter(e => questionIds.includes(e._id));
          setExercises(prev => {
            // Merge with existing exercises, avoid duplicates
            const existingIds = prev.map(e => e._id);
            const newExercises = quizExercises.filter(e => !existingIds.includes(e._id));
            return [...prev, ...newExercises];
          });
        } catch (err) {
          console.error('Error fetching exercises for quiz:', err);
        }
      }
    } catch (err) {
      // Fallback to basic quiz data if fetch fails
      setFormData({
        title: quiz.title,
        description: quiz.description || '',
        timeLimit: quiz.timeLimit || 30,
        topics: quiz.topics?.map(t => t._id || t) || [],
        questions: quiz.questions || [],
        grade: quiz.grade || 5
      });
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài thi này?')) return;

    try {
      await api.delete(`/quizzes/${id}`);
      await fetchQuizzes();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const addQuestion = async () => {
    try {
      // Upload image first if there's a file
      let questionImageUrl = questionFormData.questionImage || '';
      if (questionFormData.questionImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', questionFormData.questionImageFile);

        try {
          const uploadResponse = await api.post('/upload/question-image', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          questionImageUrl = uploadResponse.data.data.imageUrl;
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          alert('Không thể tải lên hình ảnh. Tiếp tục tạo câu hỏi không có ảnh.');
        }
      }

      // Create exercise first, then add ID to quiz
      const questionData = {
        type: questionFormData.type,
        question: questionFormData.question,
        options: questionFormData.type === 'multiple-choice'
          ? questionFormData.options.filter(opt => opt.trim() !== '')
          : [],
        correctAnswer: questionFormData.correctAnswer,
        explanation: questionFormData.explanation,
        difficulty: questionFormData.difficulty,
        points: questionFormData.points,
        questionImage: questionImageUrl
      };

      // We need a lessonId to create exercise
      // Get from first topic or any available lesson
      let lessonIdForExercise = null;

      if (formData.topics && formData.topics.length > 0) {
        try {
          const lessonsResponse = await api.get(`/lessons?topicId=${formData.topics[0]}`);
          if (lessonsResponse.data.data && lessonsResponse.data.data.length > 0) {
            lessonIdForExercise = lessonsResponse.data.data[0]._id;
          }
        } catch (err) {
          console.error('Error fetching lesson:', err);
        }
      }

      if (!lessonIdForExercise) {
        try {
          const allLessonsResponse = await api.get('/lessons');
          if (allLessonsResponse.data.data && allLessonsResponse.data.data.length > 0) {
            lessonIdForExercise = allLessonsResponse.data.data[0]._id;
          } else {
            alert('Không tìm thấy bài học nào. Vui lòng tạo bài học trước.');
            return;
          }
        } catch (err) {
          alert('Không tìm thấy bài học nào. Vui lòng tạo bài học trước.');
          return;
        }
      }

      // Create exercise
      const response = await api.post('/exercises', {
        ...questionData,
        lessonId: lessonIdForExercise
      });

      // Add exercise ID to quiz questions
      setFormData({
        ...formData,
        questions: [...formData.questions, response.data.data._id]
      });

      setShowQuestionModal(false);
      resetQuestionForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo câu hỏi');
    }
  };

  const handleToggleExercise = (exerciseId) => {
    setSelectedExerciseIds(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleAddSelectedExercises = () => {
    const newQuestionIds = selectedExerciseIds.filter(id =>
      !formData.questions.includes(id)
    );

    setFormData({
      ...formData,
      questions: [...formData.questions, ...newQuestionIds]
    });

    setSelectedExerciseIds([]);
    setShowQuestionBankModal(false);
  };

  const handleAddRandomExercises = () => {
    // Filter out already added questions
    const availableExercises = bankExercises.filter(ex =>
      !formData.questions.includes(ex._id)
    );

    if (availableExercises.length === 0) {
      alert('Không còn câu hỏi nào để thêm từ bộ lọc hiện tại');
      return;
    }

    const count = Math.min(randomCount, availableExercises.length);

    // Shuffle and pick random exercises
    const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
    const randomExercises = shuffled.slice(0, count);
    const randomIds = randomExercises.map(ex => ex._id);

    setFormData({
      ...formData,
      questions: [...formData.questions, ...randomIds]
    });

    alert(`Đã thêm ngẫu nhiên ${count} câu hỏi vào bài thi!`);
    setShowQuestionBankModal(false);
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

      // Step 2: Parse CSV (forQuiz = true means we don't need lessonId)
      const parseResponse = await api.post('/import/questions', {
        csvData,
        forQuiz: true // Import for quiz, not exercises
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
      // Get a lessonId to use for creating exercises
      // Try to get from first topic of quiz, or get any available lesson
      let lessonIdForExercise = null;

      if (formData.topics && formData.topics.length > 0) {
        try {
          const lessonsResponse = await api.get(`/lessons?topicId=${formData.topics[0]}`);
          if (lessonsResponse.data.data && lessonsResponse.data.data.length > 0) {
            lessonIdForExercise = lessonsResponse.data.data[0]._id;
          }
        } catch (err) {
          console.error('Error fetching lesson:', err);
        }
      }

      // If no lesson found from topics, get any available lesson
      if (!lessonIdForExercise) {
        try {
          const allLessonsResponse = await api.get('/lessons');
          if (allLessonsResponse.data.data && allLessonsResponse.data.data.length > 0) {
            lessonIdForExercise = allLessonsResponse.data.data[0]._id;
          } else {
            throw new Error('Không tìm thấy bài học nào. Vui lòng tạo bài học trước khi import câu hỏi cho quiz.');
          }
        } catch (err) {
          alert(err.message || 'Không tìm thấy bài học nào. Vui lòng tạo bài học trước.');
          return;
        }
      }

      // Create exercises from preview questions
      const createdExerciseIds = [];
      for (const question of previewQuestions) {
        try {
          const response = await api.post('/exercises', {
            ...question,
            lessonId: lessonIdForExercise
          });
          createdExerciseIds.push(response.data.data._id);
        } catch (err) {
          console.error('Error creating exercise:', err);
          // Continue with other questions even if one fails
        }
      }

      if (createdExerciseIds.length === 0) {
        alert('Không thể tạo câu hỏi nào. Vui lòng thử lại.');
        return;
      }

      // Add exercise IDs to quiz questions
      setFormData({
        ...formData,
        questions: [...formData.questions, ...createdExerciseIds]
      });

      setShowPreviewModal(false);
      setPreviewQuestions([]);
      setImportUrl('');
      alert(`Đã thêm ${createdExerciseIds.length} câu hỏi vào bài thi!`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi import câu hỏi');
    }
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      timeLimit: 30,
      topics: [],
      questions: [],
      grade: selectedGrade
    });
    setEditingQuiz(null);
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      points: 1,
      questionImage: '',
      questionImageFile: null
    });
  };

  const openEditQuestion = (questionId) => {
    const questionDetails = exercises.find(e => e._id === questionId);
    if (questionDetails) {
      setEditingQuestion(questionDetails);
      setQuestionFormData({
        type: questionDetails.type || 'multiple-choice',
        question: questionDetails.question || '',
        options: questionDetails.options && questionDetails.options.length > 0
          ? [...questionDetails.options]
          : ['', '', '', ''],
        correctAnswer: questionDetails.correctAnswer || '',
        explanation: questionDetails.explanation || '',
        difficulty: questionDetails.difficulty || 'medium',
        points: questionDetails.points || 1,
        questionImage: questionDetails.questionImage || '',
        questionImageFile: null
      });
      setShowEditQuestionModal(true);
    } else {
      alert('Không tìm thấy thông tin câu hỏi. Vui lòng tải lại trang.');
    }
  };

  const updateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      // Upload image first if there's a new file
      let questionImageUrl = questionFormData.questionImage || '';
      if (questionFormData.questionImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', questionFormData.questionImageFile);

        try {
          const uploadResponse = await api.post('/upload/question-image', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          questionImageUrl = uploadResponse.data.data.imageUrl;
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          alert('Không thể tải lên hình ảnh. Tiếp tục cập nhật câu hỏi không có ảnh mới.');
        }
      }

      // Update exercise
      const updateData = {
        type: questionFormData.type,
        question: questionFormData.question,
        options: questionFormData.type === 'multiple-choice'
          ? questionFormData.options.filter(opt => opt.trim() !== '')
          : [],
        correctAnswer: questionFormData.correctAnswer,
        explanation: questionFormData.explanation,
        difficulty: questionFormData.difficulty,
        points: questionFormData.points,
        questionImage: questionImageUrl
      };

      await api.put(`/exercises/${editingQuestion._id}`, updateData);

      // Refresh exercises list
      await fetchAllExercises();

      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      resetQuestionForm();
      alert('Cập nhật câu hỏi thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật câu hỏi');
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchTopics();
    fetchAllExercises();
  }, [fetchAllExercises, fetchQuizzes, fetchTopics]);

  useEffect(() => {
    if (showQuestionBankModal) {
      fetchBankTopics();
    }
  }, [fetchBankTopics, showQuestionBankModal]);

  useEffect(() => {
    if (showQuestionBankModal) {
      fetchBankExercises();
    }
  }, [selectedBankTopic, selectedBankLesson, selectedBankDifficulty, selectedBankType, showQuestionBankModal, fetchBankExercises]);

  useEffect(() => {
    if (showQuestionBankModal && selectedBankTopic) {
      fetchBankLessons(selectedBankTopic);
    } else if (showQuestionBankModal && !selectedBankTopic) {
      setBankLessons([]);
      setSelectedBankLesson('');
    }
  }, [fetchBankLessons, selectedBankTopic, showQuestionBankModal]);

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Quiz/Bài thi</h1>
          <p className="text-gray-600">Tạo và quản lý bài kiểm tra</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Tạo bài thi mới
        </button>
      </div>

      {/* Quizzes List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên bài thi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số câu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quizzes.filter(quiz => quiz.grade === selectedGrade).map((quiz) => (
              <tr key={quiz._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{quiz.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    Lớp {quiz.grade || 5}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {quiz.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{quiz.totalQuestions || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{quiz.timeLimit} phút</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="text-primary-600 hover:text-primary-700 mr-4"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quizzes.filter(quiz => quiz.grade === selectedGrade).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có bài thi nào cho Lớp {selectedGrade}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingQuiz ? 'Sửa bài thi' : 'Tạo bài thi mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên bài thi *
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
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian làm bài (phút) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lớp *
                  </label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={1}>Lớp 1</option>
                    <option value={2}>Lớp 2</option>
                    <option value={3}>Lớp 3</option>
                    <option value={4}>Lớp 4</option>
                    <option value={5}>Lớp 5</option>
                  </select>
                </div>
              </div>

              {/* Questions Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Câu hỏi ({formData.questions.length})
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowQuestionModal(true)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      + Tạo mới
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      📥 Import từ Google Sheets
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExerciseIds([]);
                        setShowQuestionBankModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      📚 Chọn từ ngân hàng
                    </button>
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {formData.questions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Chưa có câu hỏi nào</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.questions.map((q, index) => {
                        // q is an ID (string) when loaded from database
                        const questionId = typeof q === 'string' ? q : (q._id || q);
                        // Try to find question details from exercises list
                        const questionDetails = exercises.find(e => e._id === questionId);
                        const questionText = questionDetails?.question
                          ? questionDetails.question.substring(0, 50) + (questionDetails.question.length > 50 ? '...' : '')
                          : `Câu hỏi #${index + 1}`;
                        const questionType = questionDetails?.type
                          ? (questionDetails.type === 'multiple-choice' ? 'Trắc nghiệm' :
                            questionDetails.type === 'fill-blank' ? 'Điền khuyết' :
                              questionDetails.type === 'short-answer' ? 'Trả lời ngắn' : 'Tự luận')
                          : 'Trắc nghiệm';
                        const questionDifficulty = questionDetails?.difficulty
                          ? (questionDetails.difficulty === 'easy' ? 'Dễ' :
                            questionDetails.difficulty === 'medium' ? 'Trung bình' : 'Khó')
                          : '-';
                        const questionPoints = questionDetails?.points || '-';

                        return (
                          <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Câu {index + 1}: {questionText}</p>
                                {questionDetails?.questionImage && (
                                  <span className="text-xs text-blue-600" title="Có hình ảnh">🖼️</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {questionType} • {questionDifficulty} • {questionPoints} điểm
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openEditQuestion(questionId)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingQuiz ? 'Cập nhật' : 'Tạo mới'}
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

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Tạo câu hỏi mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại câu hỏi *
                </label>
                <select
                  required
                  value={questionFormData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setQuestionFormData({
                      ...questionFormData,
                      type: newType,
                      options: newType === 'multiple-choice' ? ['', '', '', ''] : [],
                      correctAnswer: ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="short-answer">Trả lời ngắn (nhập đáp án)</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ LaTeX) *
                </label>
                <textarea
                  required
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập câu hỏi..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh câu hỏi (tùy chọn)
                </label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setQuestionFormData({
                            ...questionFormData,
                            questionImageFile: file,
                            questionImage: URL.createObjectURL(file)
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Định dạng: JPEG, PNG, GIF, WebP. Tối đa 5MB.</p>
                  </div>
                  {questionFormData.questionImage && (
                    <div className="relative">
                      <img
                        src={
                          questionFormData.questionImage.startsWith('blob:') || questionFormData.questionImage.startsWith('http') || questionFormData.questionImage.startsWith('data:')
                            ? questionFormData.questionImage
                            : `${getBaseUrl()}${questionFormData.questionImage}`
                        }
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => { e.target.alt = 'Không thể tải ảnh'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setQuestionFormData({ ...questionFormData, questionImage: '', questionImageFile: null })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {questionFormData.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Các lựa chọn *
                  </label>
                  {questionFormData.options.map((option, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={questionFormData.correctAnswer === option}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                        className="mr-2"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionFormData.options];
                          newOptions[index] = e.target.value;
                          setQuestionFormData({ ...questionFormData, options: newOptions });
                        }}
                        placeholder={`Lựa chọn ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(questionFormData.type === 'fill-blank' || questionFormData.type === 'essay' || questionFormData.type === 'short-answer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đáp án đúng *
                  </label>
                  <input
                    type="text"
                    required
                    value={questionFormData.correctAnswer}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={questionFormData.type === 'short-answer' ? 'Nhập đáp án đúng mà học sinh cần nhập' : ''}
                  />
                  {questionFormData.type === 'short-answer' && (
                    <p className="text-xs text-gray-500 mt-1">Học sinh sẽ cần nhập chính xác đáp án này để được tính đúng.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thích
                </label>
                <textarea
                  value={questionFormData.explanation}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ *
                  </label>
                  <select
                    required
                    value={questionFormData.difficulty}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, difficulty: e.target.value })}
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
                    value={questionFormData.points}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Thêm vào bài thi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionModal(false);
                    resetQuestionForm();
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

      {/* Edit Question Modal */}
      {showEditQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Sửa câu hỏi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại câu hỏi *
                </label>
                <select
                  required
                  value={questionFormData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setQuestionFormData({
                      ...questionFormData,
                      type: newType,
                      options: newType === 'multiple-choice' ? (questionFormData.options.length > 0 ? questionFormData.options : ['', '', '', '']) : [],
                      correctAnswer: newType === 'multiple-choice' ? '' : questionFormData.correctAnswer
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="short-answer">Trả lời ngắn (nhập đáp án)</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi (hỗ trợ LaTeX) *
                </label>
                <textarea
                  required
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập câu hỏi..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh câu hỏi (tùy chọn)
                </label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setQuestionFormData({
                            ...questionFormData,
                            questionImageFile: file,
                            questionImage: URL.createObjectURL(file)
                          });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Định dạng: JPEG, PNG, GIF, WebP. Tối đa 5MB.</p>
                  </div>
                  {questionFormData.questionImage && (
                    <div className="relative">
                      <img
                        src={questionFormData.questionImage.startsWith('blob:') || questionFormData.questionImage.startsWith('http')
                          ? questionFormData.questionImage
                          : `${getBaseUrl()}${questionFormData.questionImage}`}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => setQuestionFormData({ ...questionFormData, questionImage: '', questionImageFile: null })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {questionFormData.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Các lựa chọn *
                  </label>
                  {questionFormData.options.map((option, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-2">
                      <input
                        type="radio"
                        name="editCorrectAnswer"
                        value={option}
                        checked={questionFormData.correctAnswer === option}
                        onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                        className="mr-2"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionFormData.options];
                          newOptions[index] = e.target.value;
                          setQuestionFormData({ ...questionFormData, options: newOptions });
                        }}
                        placeholder={`Lựa chọn ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {(questionFormData.type === 'fill-blank' || questionFormData.type === 'essay' || questionFormData.type === 'short-answer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đáp án đúng *
                  </label>
                  <input
                    type="text"
                    required
                    value={questionFormData.correctAnswer}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={questionFormData.type === 'short-answer' ? 'Nhập đáp án đúng mà học sinh cần nhập' : ''}
                  />
                  {questionFormData.type === 'short-answer' && (
                    <p className="text-xs text-gray-500 mt-1">Học sinh sẽ cần nhập chính xác đáp án này để được tính đúng.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giải thích
                </label>
                <textarea
                  value={questionFormData.explanation}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ *
                  </label>
                  <select
                    required
                    value={questionFormData.difficulty}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, difficulty: e.target.value })}
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
                    value={questionFormData.points}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={updateQuestion}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditQuestionModal(false);
                    setEditingQuestion(null);
                    resetQuestionForm();
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
                      <span className={`px-2 py-1 rounded text-xs ${question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
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
                        className={`p-2 rounded ${option === question.correctAnswer
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
                Xác nhận và Thêm vào bài thi ({previewQuestions.length} câu hỏi)
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

      {/* Question Bank Modal */}
      {showQuestionBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Chọn câu hỏi từ ngân hàng</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp
                </label>
                <select
                  value={formData.grade}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                >
                  <option value={formData.grade}>Lớp {formData.grade}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ đề
                </label>
                <select
                  value={selectedBankTopic}
                  onChange={(e) => {
                    setSelectedBankTopic(e.target.value);
                    setSelectedBankLesson('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả chủ đề</option>
                  {bankTopics.filter(t => t.grade === formData.grade).map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bài học
                </label>
                <select
                  value={selectedBankLesson}
                  onChange={(e) => setSelectedBankLesson(e.target.value)}
                  disabled={!selectedBankTopic}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                >
                  <option value="">Tất cả bài học</option>
                  {bankLessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      Bài {lesson.order}: {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức độ
                </label>
                <select
                  value={selectedBankDifficulty}
                  onChange={(e) => setSelectedBankDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại
                </label>
                <select
                  value={selectedBankType}
                  onChange={(e) => setSelectedBankType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả loại</option>
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền khuyết</option>
                  <option value="short-answer">Trả lời ngắn</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>
            </div>

            {/* Random Selection */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-800">🎲 Chọn ngẫu nhiên:</span>
                  <input
                    type="number"
                    min="1"
                    max={bankExercises.filter(ex => !formData.questions.includes(ex._id)).length || 100}
                    value={randomCount}
                    onChange={(e) => setRandomCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <span className="text-sm text-blue-700">câu hỏi</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRandomExercises}
                  disabled={bankExercises.filter(ex => !formData.questions.includes(ex._id)).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎲 Thêm ngẫu nhiên
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Có {bankExercises.filter(ex => !formData.questions.includes(ex._id)).length} câu hỏi khả dụng từ bộ lọc hiện tại
              </p>
            </div>

            {/* Selected count */}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Đã chọn: <span className="font-semibold text-primary-600">{selectedExerciseIds.length}</span> câu hỏi
              </p>
              <button
                onClick={() => setSelectedExerciseIds([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Bỏ chọn tất cả
              </button>
            </div>

            {/* Exercises List */}
            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto mb-4">
              {bankLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : bankExercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy câu hỏi nào
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {bankExercises.map((exercise) => {
                    const isSelected = selectedExerciseIds.includes(exercise._id);
                    const isAlreadyAdded = formData.questions.includes(exercise._id);

                    return (
                      <div
                        key={exercise._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                          } ${isAlreadyAdded ? 'opacity-50' : ''}`}
                        onClick={() => !isAlreadyAdded && handleToggleExercise(exercise._id)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isAlreadyAdded && handleToggleExercise(exercise._id)}
                            disabled={isAlreadyAdded}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {exercise.question.substring(0, 100)}
                                {exercise.question.length > 100 && '...'}
                              </span>
                              {isAlreadyAdded && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  Đã thêm
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>📚 {exercise.lessonId?.topicId?.title || '-'}</span>
                              <span>📖 {exercise.lessonId ? `Bài ${exercise.lessonId.order}` : '-'}</span>
                              <span className={`px-2 py-1 rounded ${exercise.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                exercise.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {exercise.difficulty === 'easy' ? 'Dễ' :
                                  exercise.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                              </span>
                              <span>
                                {exercise.type === 'multiple-choice' ? 'Trắc nghiệm' :
                                  exercise.type === 'fill-blank' ? 'Điền khuyết' :
                                    exercise.type === 'short-answer' ? 'Trả lời ngắn' : 'Tự luận'}
                              </span>
                              <span>{exercise.points || 1} điểm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddSelectedExercises}
                disabled={selectedExerciseIds.length === 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm {selectedExerciseIds.length > 0 ? `${selectedExerciseIds.length} ` : ''}câu hỏi đã chọn
              </button>
              <button
                onClick={() => {
                  setShowQuestionBankModal(false);
                  setSelectedExerciseIds([]);
                  setSelectedBankTopic('');
                  setSelectedBankLesson('');
                  setSelectedBankDifficulty('');
                  setSelectedBankType('');
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

export default AdminQuizzes;

