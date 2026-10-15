import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const GradeSelection = () => {
  const navigate = useNavigate();
  const { selectedGrade, setGrade } = useAuth();
  const [currentSelected, setCurrentSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedGrade) {
      setCurrentSelected(selectedGrade);
    }
  }, [selectedGrade]);

  const grades = [
    { number: 1, label: 'Lớp 1', available: true, icon: '📚', color: 'from-blue-400 to-blue-600' },
    { number: 2, label: 'Lớp 2', available: true, icon: '📖', color: 'from-purple-400 to-purple-600' },
    { number: 3, label: 'Lớp 3', available: true, icon: '📝', color: 'from-pink-400 to-pink-600' },
    { number: 4, label: 'Lớp 4', available: true, icon: '📐', color: 'from-orange-400 to-orange-600' },
    { number: 5, label: 'Lớp 5', available: true, icon: '✨', color: 'from-green-400 to-green-600' },
  ];

  const handleSelectGrade = (grade) => {
    setLoading(true);
    setCurrentSelected(grade.number);

    // Lưu grade vào localStorage và context
    setGrade(grade.number);

    // Navigate to home page
    setTimeout(() => {
      navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-100 relative overflow-hidden">
      {/* Pastel Decorative Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"
          style={{ top: '-10%', left: '-10%' }}
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-pink-300/20 rounded-full blur-3xl"
          style={{ bottom: '-10%', right: '-10%' }}
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl"
          style={{ top: '50%', right: '-5%' }}
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-56 h-56 bg-green-300/20 rounded-full blur-3xl"
          style={{ bottom: '20%', left: '-5%' }}
          animate={{
            x: [0, 25, 0],
            y: [0, -25, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Xin chào! Hãy lựa chọn lớp học của mình.
          </h1>
        </motion.div>

        {/* Grade Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-7xl mx-auto">
          {grades.map((grade, index) => (
            <motion.div
              key={grade.number}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, type: 'spring' }}
              onClick={() => handleSelectGrade(grade)}
              className={`
                relative bg-white rounded-3xl shadow-lg cursor-pointer
                transition-all duration-300 transform
                aspect-square flex flex-col items-center justify-center p-8
                ${grade.available
                  ? 'hover:-translate-y-2 hover:shadow-2xl'
                  : 'hover:-translate-y-2 hover:shadow-2xl opacity-75'
                }
                ${currentSelected === grade.number && grade.available ? 'ring-4 ring-green-400' : ''}
                ${loading && currentSelected === grade.number ? 'pointer-events-none' : ''}
                ${grade.available ? 'animate-bounce' : ''}
              `}
              style={{
                animation: grade.available ? 'bounce 2s ease-in-out infinite' : 'none',
                animationDelay: grade.available ? '1s' : '0s',
              }}
            >
              {/* Top Border */}
              <div className={`
                absolute top-0 left-0 right-0 h-2 rounded-t-3xl
                ${grade.available
                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                  : 'bg-gradient-to-r from-gray-400 to-gray-600'
                }
              `} />

              {/* Badge "Sắp ra mắt" */}
              {!grade.available && (
                <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  🔒 Sắp ra mắt
                </div>
              )}

              {/* Badge "Đang học" */}
              {currentSelected === grade.number && grade.available && (
                <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  ✅ Đang học
                </div>
              )}

              {/* Icon */}
              <div className={`
                text-6xl mb-4
                ${!grade.available ? 'grayscale opacity-60' : ''}
              `}>
                {grade.icon}
              </div>

              {/* Grade Number */}
              <div className={`
                text-7xl md:text-8xl font-extrabold mb-2
                bg-clip-text text-transparent bg-gradient-to-br
                ${grade.available
                  ? 'from-green-400 to-green-600'
                  : 'from-gray-400 to-gray-600'
                }
              `}>
                {grade.number}
              </div>

              {/* Label */}
              <h3 className={`
                text-xl md:text-2xl font-semibold mb-4
                ${grade.available ? 'text-gray-800' : 'text-gray-500'}
              `}>
                {grade.label}
              </h3>

              {/* Status Badge */}
              {grade.available ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  ✅ Bắt đầu học
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">
                  🔒 Sắp ra mắt
                </span>
              )}

              {/* Loading indicator */}
              {loading && currentSelected === grade.number && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 border-t-transparent"></div>
                </div>
              )}

              {/* Lock overlay on hover for locked cards */}
              {!grade.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="text-6xl">🔒</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Design by group */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-600 mb-2">Design by group 32:</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Nguyễn Văn Hoàng</p>
            <p>Nguyễn Công Anh Nguyên</p>
            <p>Nguyễn Văn Nhật</p>
          </div>
        </motion.div>
      </div>

      {/* Custom bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default GradeSelection;
