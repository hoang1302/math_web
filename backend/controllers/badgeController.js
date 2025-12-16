import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import UserProgress from '../models/UserProgress.js';
import QuizResult from '../models/QuizResult.js';
import Exercise from '../models/Exercise.js';

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
export const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true })
      .sort({ rarity: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user badges
// @route   GET /api/badges/user
// @access  Private
export const getUserBadges = async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.user.id })
      .populate('badgeId')
      .sort({ earnedAt: -1 });

    // Get all badges to show which ones are not earned
    const allBadges = await Badge.find({ isActive: true });
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId._id.toString()));

    const badgesWithStatus = allBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId._id.toString() === badge._id.toString());
      return {
        ...badge.toObject(),
        earned: !!userBadge,
        earnedAt: userBadge ? userBadge.earnedAt : null,
        metadata: userBadge ? userBadge.metadata : null
      };
    });

    res.status(200).json({
      success: true,
      count: badgesWithStatus.length,
      earnedCount: userBadges.length,
      data: badgesWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to check and award badges (can be called from other controllers)
export const checkAndAwardBadges = async (userId) => {
  try {
    const newlyEarnedBadges = [];

    // Get all active badges
    const badges = await Badge.find({ isActive: true });
    
    // Get user's existing badges
    const existingUserBadges = await UserBadge.find({ userId });
    const existingBadgeIds = new Set(existingUserBadges.map(ub => ub.badgeId.toString()));

    for (const badge of badges) {
      // Skip if already earned
      if (existingBadgeIds.has(badge._id.toString())) {
        continue;
      }

      const condition = badge.condition;
      let shouldAward = false;
      let metadata = {};

      // Check different badge conditions
      switch (condition.type) {
        case 'exercises_completed':
          const completedExercises = await UserProgress.countDocuments({
            userId,
            completed: true
          });
          if (completedExercises >= condition.value) {
            shouldAward = true;
            metadata = { exercisesCompleted: completedExercises };
          }
          break;

        case 'quiz_score':
          const quizResults = await QuizResult.find({ userId });
          if (condition.timeLimit) {
            // Check for quiz completed within time limit with high score
            const qualifyingQuizzes = quizResults.filter(qr => 
              qr.percentage >= condition.value && 
              qr.timeSpent <= condition.timeLimit * 60
            );
            if (qualifyingQuizzes.length > 0) {
              shouldAward = true;
              metadata = { 
                quizCount: qualifyingQuizzes.length,
                bestScore: Math.max(...qualifyingQuizzes.map(q => q.percentage))
              };
            }
          } else {
            // Check for any quiz with score >= value
            const highScoreQuizzes = quizResults.filter(qr => qr.percentage >= condition.value);
            if (highScoreQuizzes.length > 0) {
              shouldAward = true;
              metadata = { 
                quizCount: highScoreQuizzes.length,
                bestScore: Math.max(...highScoreQuizzes.map(q => q.percentage))
              };
            }
          }
          break;

        case 'lessons_completed':
          const completedLessons = await UserProgress.countDocuments({
            userId,
            completed: true
          });
          if (completedLessons >= condition.value) {
            shouldAward = true;
            metadata = { lessonsCompleted: completedLessons };
          }
          break;

        case 'streak':
          // Check for consecutive days of activity
          // This is a simplified version - you might want to track daily activity
          const recentProgress = await UserProgress.find({ userId })
            .sort({ lastAttemptAt: -1 })
            .limit(condition.value);
          
          if (recentProgress.length >= condition.value) {
            // Check if they're consecutive days
            const dates = recentProgress.map(p => 
              new Date(p.lastAttemptAt).toDateString()
            );
            const uniqueDates = new Set(dates);
            if (uniqueDates.size >= condition.value) {
              shouldAward = true;
              metadata = { streak: uniqueDates.size };
            }
          }
          break;

        default:
          break;
      }

      if (shouldAward) {
        // Award badge
        await UserBadge.create({
          userId,
          badgeId: badge._id,
          metadata
        });
        newlyEarnedBadges.push({
          id: badge._id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          metadata
        });
      }
    }

    return {
      success: true,
      newlyEarned: newlyEarnedBadges,
      count: newlyEarnedBadges.length
    };
  } catch (error) {
    console.error('Error checking badges:', error);
    return {
      success: false,
      newlyEarned: [],
      count: 0
    };
  }
};

// @desc    Check and award badges (automated)
// @route   POST /api/badges/check
// @access  Private
export const checkBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await checkAndAwardBadges(userId);

    res.status(200).json({
      success: true,
      message: result.count > 0 
        ? `Earned ${result.count} new badge(s)!`
        : 'No new badges earned',
      newlyEarned: result.newlyEarned,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

