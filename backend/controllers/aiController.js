import { GoogleGenerativeAI } from '@google/generative-ai';
import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('⚠️  GEMINI_API_KEY is not set in environment variables!');
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// @desc    Generate exercises using AI
// @route   POST /api/ai/generate-exercises
// @access  Private/Admin
export const generateExercises = async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || !genAI) {
      return res.status(500).json({
        success: false,
        message: 'API key Gemini chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env'
      });
    }

    const { topic, lessonId, difficulty, type, count = 5 } = req.body;

    // Validate inputs
    if (!topic && !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp topic hoặc lessonId'
      });
    }

    // Get lesson info if lessonId provided
    let lessonInfo = '';
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId).populate('topicId', 'title');
      if (lesson) {
        lessonInfo = `Bài học: ${lesson.title}. Chủ đề: ${lesson.topicId?.title || 'N/A'}.`;
      }
    }

    // Build prompt for AI
    const difficultyText = difficulty === 'easy' ? 'dễ' : difficulty === 'medium' ? 'trung bình' : 'khó';
    const typeText = type === 'multiple-choice' ? 'trắc nghiệm' : 
                     type === 'fill-blank' ? 'điền khuyết' : 'tự luận';

    const prompt = `Bạn là giáo viên toán lớp 5. Hãy tạo ${count} câu hỏi toán học lớp 5.

Yêu cầu:
- Chủ đề: ${topic || 'theo bài học đã cho'}
${lessonInfo ? `- ${lessonInfo}` : ''}
- Mức độ: ${difficultyText}
- Loại câu hỏi: ${typeText}
- Câu hỏi phải phù hợp với chương trình toán lớp 5

${type === 'multiple-choice' ? `
Đối với câu hỏi trắc nghiệm, mỗi câu hỏi cần có:
1. Câu hỏi (có thể dùng LaTeX cho công thức toán, ví dụ: $x^2$ hoặc \\frac{a}{b})
2. 4 lựa chọn (A, B, C, D)
3. Đáp án đúng (ghi rõ là A, B, C, hoặc D)
4. Giải thích chi tiết cách giải

Trả về dưới dạng JSON array, mỗi object có format:
{
  "question": "Câu hỏi...",
  "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
  "correctAnswer": "Lựa chọn A",
  "explanation": "Giải thích chi tiết...",
  "difficulty": "${difficulty}",
  "type": "multiple-choice",
  "points": 1
}
` : type === 'fill-blank' ? `
Đối với câu hỏi điền khuyết, mỗi câu hỏi cần có:
1. Câu hỏi với chỗ trống (dùng ___ hoặc ... để đánh dấu chỗ trống)
2. Đáp án đúng
3. Giải thích chi tiết

Trả về dưới dạng JSON array, mỗi object có format:
{
  "question": "Câu hỏi với ___ ở chỗ trống",
  "correctAnswer": "Đáp án đúng",
  "explanation": "Giải thích chi tiết...",
  "difficulty": "${difficulty}",
  "type": "fill-blank",
  "points": 1
}
` : `
Đối với câu hỏi tự luận, mỗi câu hỏi cần có:
1. Câu hỏi yêu cầu học sinh giải bài toán
2. Đáp án đúng (có thể là số hoặc biểu thức)
3. Giải thích chi tiết từng bước giải

Trả về dưới dạng JSON array, mỗi object có format:
{
  "question": "Câu hỏi tự luận...",
  "correctAnswer": "Đáp án đúng",
  "explanation": "Giải thích chi tiết từng bước...",
  "difficulty": "${difficulty}",
  "type": "essay",
  "points": 1
}
`}

Lưu ý:
- Chỉ trả về JSON array, không có text thêm
- Câu hỏi phải phù hợp với trình độ lớp 5
- Sử dụng LaTeX cho công thức toán khi cần
- Giải thích phải rõ ràng, dễ hiểu cho học sinh lớp 5`;

    // Call Gemini API
    let text;
    try {
      // Use gemini-2.5-flash model
      const modelsToTry = [
        'gemini-2.5-flash',         // Latest flash model
        'models/gemini-2.5-flash',  // Full path format
        'gemini-1.5-flash',         // Fallback to 1.5
        'gemini-pro',               // Fallback to pro
      ];
      
      let lastError = null;
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🤖 Trying Gemini API with model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          console.log(`📝 Prompt length: ${prompt.length} characters`);
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          
          console.log(`✅ Success with ${modelName}! Response length: ${text?.length || 0} characters`);
          
          if (!text || text.trim().length === 0) {
            throw new Error('AI không trả về nội dung. Vui lòng thử lại.');
          }
          
          // Success, break out of loop
          break;
        } catch (modelError) {
          console.log(`❌ Model ${modelName} failed: ${modelError.message}`);
          lastError = modelError;
          
          // If it's not a 404 (model not found), throw immediately
          if (!modelError.message?.includes('404') && 
              !modelError.message?.includes('not found')) {
            throw modelError;
          }
          
          // Continue to next model
          continue;
        }
      }
      
      // If we get here and text is still undefined, all models failed
      if (!text && lastError) {
        throw lastError;
      }
    } catch (apiError) {
      console.error('Gemini API Error Details:', {
        message: apiError.message,
        stack: apiError.stack,
        response: apiError.response,
        errorDetails: apiError.errorDetails
      });
      
      // Handle specific Gemini API errors
      if (apiError.message?.includes('API_KEY_INVALID') || 
          apiError.message?.includes('API key') ||
          apiError.errorDetails?.some(detail => detail.reason === 'API_KEY_INVALID')) {
        return res.status(400).json({
          success: false,
          message: 'API key không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env',
          error: 'API_KEY_INVALID'
        });
      }
      
      if (apiError.message?.includes('SAFETY') || apiError.message?.includes('safety')) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung bị chặn bởi bộ lọc an toàn. Vui lòng thử lại với prompt khác.',
          error: 'SAFETY_FILTER'
        });
      }
      
      // Re-throw to be caught by outer catch
      throw apiError;
    }

    // Parse JSON from response
    // Sometimes AI returns text with markdown code blocks, we need to extract JSON
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    // Try to parse JSON
    let exercises;
    try {
      exercises = JSON.parse(jsonText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON array from text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        exercises = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Không thể parse kết quả từ AI. Vui lòng thử lại.');
      }
    }

    // Ensure it's an array
    if (!Array.isArray(exercises)) {
      exercises = [exercises];
    }

    // Validate and format exercises
    const formattedExercises = exercises.map((ex, index) => {
      // For multiple-choice, ensure correctAnswer is one of the options
      if (ex.type === 'multiple-choice' && ex.options && ex.correctAnswer) {
        // Check if correctAnswer is a letter (A, B, C, D) or the actual answer
        const correctAnswerStr = String(ex.correctAnswer).trim();
        if (['A', 'B', 'C', 'D'].includes(correctAnswerStr)) {
          // Convert letter to actual option value
          const optionIndex = correctAnswerStr.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          if (ex.options[optionIndex]) {
            ex.correctAnswer = ex.options[optionIndex];
          }
        }
      }

      return {
        question: ex.question || `Câu hỏi ${index + 1}`,
        options: ex.options || [],
        correctAnswer: ex.correctAnswer || '',
        explanation: ex.explanation || '',
        difficulty: ex.difficulty || difficulty || 'medium',
        type: ex.type || type || 'multiple-choice',
        points: ex.points || 1,
        lessonId: lessonId || null
      };
    });

    res.status(200).json({
      success: true,
      count: formattedExercises.length,
      data: formattedExercises
    });
  } catch (error) {
    console.error('Error generating exercises with AI:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      response: error.response,
      errorDetails: error.errorDetails
    });
    
    // Check if it's an API key error
    if (error.message?.includes('API_KEY_INVALID') || 
        error.message?.includes('API key') ||
        error.errorDetails?.some(detail => detail.reason === 'API_KEY_INVALID')) {
      return res.status(400).json({
        success: false,
        message: 'API key không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env',
        error: 'API_KEY_INVALID',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    const errorDetails = process.env.NODE_ENV === 'development'
      ? {
          name: error.name,
          stack: error.stack,
          errorDetails: error.errorDetails
        }
      : undefined;
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo câu hỏi bằng AI',
      error: errorMessage,
      ...(errorDetails && { details: errorDetails })
    });
  }
};

