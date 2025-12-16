import UserProgress from '../models/UserProgress.js';
import Lesson from '../models/Lesson.js';
import Topic from '../models/Topic.js';
import QuizResult from '../models/QuizResult.js';
import Quiz from '../models/Quiz.js';
import UserBadge from '../models/UserBadge.js';
import User from '../models/User.js';
import { checkAndAwardBadges } from './badgeController.js';

// @desc    Get user progress
// @route   GET /api/progress
// @access  Private
export const getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.user.id })
      .populate('lessonId', 'title topicId order')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get lesson progress
// @route   GET /api/progress/lessons/:lessonId
// @access  Private
export const getLessonProgress = async (req, res) => {
  try {
    const progress = await UserProgress.findOne({
      userId: req.user.id,
      lessonId: req.params.lessonId
    }).populate('lessonId', 'title topicId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found for this lesson'
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid lesson ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update lesson progress
// @route   POST /api/progress/lessons/:lessonId
// @access  Private
export const updateLessonProgress = async (req, res) => {
  try {
    const { completed, completionPercentage, score, timeSpent } = req.body;

    // Verify lesson exists
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Find or create progress
    let progress = await UserProgress.findOne({
      userId: req.user.id,
      lessonId: req.params.lessonId
    });

    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        lessonId: req.params.lessonId,
        completed: completed || false,
        completionPercentage: completionPercentage || 0,
        bestScore: score || 0,
        attempts: 1,
        timeSpent: timeSpent || 0,
        lastAttemptAt: new Date()
      });
    } else {
      // Update progress
      if (completed !== undefined) {
        progress.completed = completed;
        if (completed && !progress.completedAt) {
          progress.completedAt = new Date();
        }
      }
      if (completionPercentage !== undefined) {
        progress.completionPercentage = Math.min(100, Math.max(0, completionPercentage));
      }
      if (score !== undefined) {
        progress.bestScore = Math.max(progress.bestScore, score);
      }
      if (timeSpent !== undefined) {
        progress.timeSpent += timeSpent;
      }
      progress.attempts += 1;
      progress.lastAttemptAt = new Date();
      await progress.save();
    }

    // Mark study activity for streaks when a lesson is completed
    if (completed) {
      const user = await User.findById(req.user.id);
      if (user) {
        const startOfDay = (date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d;
        };
        const today = startOfDay(new Date());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const lastStudyDate = user.streak?.lastStudyDate ? startOfDay(user.streak.lastStudyDate) : null;
        let currentStreak = user.streak?.current || 0;

        if (!lastStudyDate) {
          currentStreak = 1;
        } else if (lastStudyDate.getTime() === today.getTime()) {
          // Already counted today; keep streak
          currentStreak = currentStreak || 1;
        } else if (lastStudyDate.getTime() === yesterday.getTime()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }

        user.streak = {
          ...user.streak,
          current: currentStreak,
          lastStudyDate: today
        };
        await user.save();
      }
    }

    // Check and award badges if lesson is completed
    let newlyEarnedBadges = [];
    if (completed) {
      const badgeResult = await checkAndAwardBadges(req.user.id);
      newlyEarnedBadges = badgeResult.newlyEarned || [];
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: progress,
      newlyEarnedBadges: newlyEarnedBadges.length > 0 ? newlyEarnedBadges : undefined
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid lesson ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user statistics (dashboard)
// @route   GET /api/progress/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // Load user for streak data
    const user = await User.findById(userId);
    const today = startOfDay(new Date());
    const currentStreak = user?.streak?.current || 0;
    const lastStudyDate = user?.streak?.lastStudyDate ? startOfDay(user.streak.lastStudyDate) : null;
    const studiedToday = !!(lastStudyDate && lastStudyDate.getTime() === today.getTime());

    // Get all progress
    const allProgress = await UserProgress.find({ userId })
      .populate({
        path: 'lessonId',
        select: 'title topicId',
        populate: {
          path: 'topicId',
          select: 'title'
        }
      });

    // Get all lessons count
    const totalLessons = await Lesson.countDocuments({ isActive: true });
    const completedLessons = allProgress.filter(p => p.completed).length;
    const completionPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Calculate average score
    const scores = allProgress
      .filter(p => p.bestScore > 0)
      .map(p => p.bestScore);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Get quiz results
    let quizResults = [];
    try {
      quizResults = await QuizResult.find({ userId })
        .populate('quizId', 'title description timeLimit')
        .sort({ completedAt: -1 });
    } catch (quizErr) {
      console.error('Error fetching quiz results:', quizErr);
      quizResults = [];
    }
    
    const quizCount = quizResults.length;
    const quizAverageScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizResults.length)
      : 0;
    
    // Get completed lessons with topic info
    const completedProgress = allProgress.filter(p => {
      // Filter out null/undefined lessonId and ensure completed is true
      try {
        return p.completed === true && p.lessonId && (p.lessonId._id || p.lessonId);
      } catch (err) {
        console.error('Error filtering progress:', err);
        return false;
      }
    });
    
    const completedLessonsList = completedProgress
      .map(p => {
        try {
          // Handle both populated and non-populated topicId
          let topicId = null;
          let topicTitle = null;
          
          if (p.lessonId && p.lessonId.topicId) {
            if (typeof p.lessonId.topicId === 'object' && p.lessonId.topicId._id) {
              // Populated topicId
              topicId = p.lessonId.topicId._id;
              topicTitle = p.lessonId.topicId.title || null;
            } else {
              // Just ObjectId
              topicId = p.lessonId.topicId;
            }
          }
          
          return {
            lessonId: p.lessonId?._id || p.lessonId,
            title: p.lessonId?.title || 'Unknown Lesson',
            topicId: topicId,
            topicTitle: topicTitle,
            bestScore: p.bestScore || 0,
            attempts: p.attempts || 0,
            timeSpent: p.timeSpent || 0,
            completedAt: p.completedAt || p.updatedAt || p.createdAt,
            completionPercentage: p.completionPercentage || 100
          };
        } catch (err) {
          console.error('Error mapping completed lesson:', err);
          return null;
        }
      })
      .filter(item => item !== null && item.lessonId && item.title !== 'Unknown Lesson') // Filter out any invalid entries
      .sort((a, b) => {
        try {
          const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
          const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
          return dateB - dateA;
        } catch (err) {
          return 0;
        }
      });
    
    // Get completed quizzes list
    const completedQuizzesList = quizResults
      .filter(qr => qr.quizId && qr.quizId._id) // Filter out null quizId
      .map(qr => ({
        quizId: qr.quizId._id,
        title: qr.quizId.title || 'Unknown Quiz',
        score: qr.score || 0,
        totalScore: qr.totalScore || 0,
        percentage: qr.percentage || 0,
        correctAnswers: qr.correctAnswers || 0,
        totalQuestions: qr.totalQuestions || 0,
        timeSpent: qr.timeSpent || 0,
        completedAt: qr.completedAt || qr.createdAt
      }));

    // Calculate total study time (in minutes)
    const totalStudyTime = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Get progress by topic
    const topicProgressMap = new Map();
    allProgress.forEach(p => {
      try {
        if (p.lessonId && p.lessonId.topicId) {
          let topicId;
          if (typeof p.lessonId.topicId === 'object' && p.lessonId.topicId._id) {
            topicId = p.lessonId.topicId._id.toString();
          } else {
            topicId = p.lessonId.topicId.toString();
          }
          
          if (!topicProgressMap.has(topicId)) {
            topicProgressMap.set(topicId, { completed: 0, total: 0 });
          }
          const stats = topicProgressMap.get(topicId);
          stats.total++;
          if (p.completed) stats.completed++;
        }
      } catch (err) {
        console.error('Error processing topic progress:', err);
      }
    });

    // Get topic details
    let topicProgress = [];
    try {
      const topicIds = Array.from(topicProgressMap.keys());
      if (topicIds.length > 0) {
        const topics = await Topic.find({ _id: { $in: topicIds } });
        topicProgress = topics.map(topic => {
          const stats = topicProgressMap.get(topic._id.toString());
          return {
            topicId: topic._id,
            topicTitle: topic.title,
            completed: stats?.completed || 0,
            total: stats?.total || 0,
            percentage: stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
          };
        });
      }
    } catch (topicErr) {
      console.error('Error fetching topic progress:', topicErr);
      topicProgress = [];
    }

    // Get recent badges
    let recentBadges = [];
    try {
      const badges = await UserBadge.find({ userId })
        .populate('badgeId', 'name icon description')
        .sort({ earnedAt: -1 })
        .limit(5);
      
      recentBadges = badges
        .filter(ub => ub.badgeId && ub.badgeId._id) // Filter out null badgeId
        .map(ub => ({
          id: ub.badgeId._id,
          name: ub.badgeId.name || 'Unknown Badge',
          icon: ub.badgeId.icon || '🏆',
          description: ub.badgeId.description || '',
          earnedAt: ub.earnedAt || ub.createdAt
        }));
    } catch (badgeErr) {
      console.error('Error fetching recent badges:', badgeErr);
      recentBadges = [];
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          completionPercentage,
          completedLessons,
          totalLessons,
          averageScore,
          quizCount,
          quizAverageScore,
          totalStudyTime,
          streak: {
            current: currentStreak,
            studiedToday
          }
        },
        topicProgress: topicProgress || [],
        completedLessonsList: completedLessonsList || [],
        completedQuizzesList: completedQuizzesList || [],
        recentBadges: recentBadges || []
      }
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

