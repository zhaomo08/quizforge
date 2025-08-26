import { Question, TestResult, WrongAnswer } from '@/types';
import { storage } from './storage';

export const testUtils = {
  // Shuffle array using Fisher-Yates algorithm
  shuffleArray: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Select random questions from a category
  selectRandomQuestions: (category: string, count: number): Question[] => {
    const questions = storage.getQuestionsByCategory(category);
    if (questions.length <= count) {
      return testUtils.shuffleArray(questions);
    }
    
    const shuffled = testUtils.shuffleArray(questions);
    return shuffled.slice(0, count);
  },

  // Calculate test result
  calculateResult: (
    questions: Question[],
    userAnswers: number[],
    category: string,
    timeSpent?: number
  ): TestResult => {
    const correctAnswers = questions.reduce((count, question, index) => {
      return count + (question.correctAnswer === userAnswers[index] ? 1 : 0);
    }, 0);

    const score = Math.round((correctAnswers / questions.length) * 100);

    return {
      id: `test_${Date.now()}`,
      category,
      totalQuestions: questions.length,
      correctAnswers,
      score,
      questions,
      userAnswers,
      completedAt: new Date().toISOString(),
      timeSpent,
    };
  },

  // Save wrong answers
  saveWrongAnswers: (testResult: TestResult): void => {
    testResult.questions.forEach((question, index) => {
      if (question.correctAnswer !== testResult.userAnswers[index]) {
        const wrongAnswer: WrongAnswer = {
          questionId: question.id,
          question,
          userAnswer: testResult.userAnswers[index],
          wrongAt: testResult.completedAt,
        };
        storage.addWrongAnswer(wrongAnswer);
      }
    });
  },

  // Get performance level based on score
  getPerformanceLevel: (score: number): {
    level: string;
    color: string;
    message: string;
  } => {
    if (score >= 90) {
      return {
        level: 'Excellent',
        color: 'text-green-600',
        message: 'Outstanding performance! You have mastered this topic.',
      };
    } else if (score >= 80) {
      return {
        level: 'Good',
        color: 'text-blue-600',
        message: 'Good job! You have a solid understanding with room for improvement.',
      };
    } else if (score >= 70) {
      return {
        level: 'Fair',
        color: 'text-yellow-600',
        message: 'Fair performance. Consider reviewing the topics you missed.',
      };
    } else if (score >= 60) {
      return {
        level: 'Needs Improvement',
        color: 'text-orange-600',
        message: 'You need to strengthen your understanding of this topic.',
      };
    } else {
      return {
        level: 'Poor',
        color: 'text-red-600',
        message: 'Consider reviewing the fundamentals before attempting again.',
      };
    }
  },

  // Format time
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // Get user statistics
  getUserStats: () => {
    const testResults = storage.getTestResults();
    const wrongAnswers = storage.getWrongAnswers();

    const totalTests = testResults.length;
    const totalQuestions = testResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const correctAnswers = testResults.reduce((sum, result) => sum + result.correctAnswers, 0);
    const averageScore = totalTests > 0 ? 
      testResults.reduce((sum, result) => sum + result.score, 0) / totalTests : 0;

    // Category stats
    const categoryStats: Record<string, any> = {};
    testResults.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = {
          totalTests: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
        };
      }
      
      categoryStats[result.category].totalTests += 1;
      categoryStats[result.category].totalQuestions += result.totalQuestions;
      categoryStats[result.category].correctAnswers += result.correctAnswers;
    });

    // Calculate average scores for categories
    Object.keys(categoryStats).forEach(category => {
      const categoryResults = testResults.filter(r => r.category === category);
      categoryStats[category].averageScore = 
        categoryResults.reduce((sum, result) => sum + result.score, 0) / categoryResults.length;
    });

    return {
      totalTests,
      totalQuestions,
      correctAnswers,
      averageScore: Math.round(averageScore),
      categoryStats,
      totalWrongAnswers: wrongAnswers.length,
    };
  },
};