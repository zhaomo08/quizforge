import { Question, TestResult, WrongAnswer } from '@/types';
import { LearningGoal } from './learningAnalytics';

interface QuestionNote {
  questionId: string;
  note: string;
  timestamp: number;
}

interface QuestionStats {
  questionId: string;
  attempts: number;
  correctCount: number;
  averageTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const STORAGE_KEYS = {
  QUESTIONS: 'interview_questions',
  TEST_RESULTS: 'test_results',
  WRONG_ANSWERS: 'wrong_answers',
  API_KEY: 'openai_api_key',
  USER_PREFERENCES: 'user_preferences',
  LEARNING_GOALS: 'learning_goals',
  QUESTION_NOTES: 'question_notes',
  QUESTION_STATS: 'question_stats',
  FAVORITE_QUESTIONS: 'favorite_questions',
};

export const storage = {
  // Questions
  getQuestions: (): Question[] => {
    const questions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return questions ? JSON.parse(questions) : [];
  },

  saveQuestions: (questions: Question[]): void => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  addQuestions: (newQuestions: Question[]): void => {
    const existingQuestions = storage.getQuestions();
    const updatedQuestions = [...existingQuestions, ...newQuestions];
    storage.saveQuestions(updatedQuestions);
  },

  getQuestionsByCategory: (category: string): Question[] => {
    const questions = storage.getQuestions();
    return questions.filter(q => q.category === category);
  },

  // Test Results
  getTestResults: (): TestResult[] => {
    const results = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
    return results ? JSON.parse(results) : [];
  },

  saveTestResult: (result: TestResult): void => {
    const results = storage.getTestResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(results));
  },

  // Wrong Answers
  getWrongAnswers: (): WrongAnswer[] => {
    const wrongAnswers = localStorage.getItem(STORAGE_KEYS.WRONG_ANSWERS);
    return wrongAnswers ? JSON.parse(wrongAnswers) : [];
  },

  addWrongAnswer: (wrongAnswer: WrongAnswer): void => {
    const wrongAnswers = storage.getWrongAnswers();
    const existingIndex = wrongAnswers.findIndex(
      wa => wa.questionId === wrongAnswer.questionId
    );
    
    if (existingIndex >= 0) {
      wrongAnswers[existingIndex] = wrongAnswer;
    } else {
      wrongAnswers.push(wrongAnswer);
    }
    
    localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
  },

  removeWrongAnswer: (questionId: string): void => {
    const wrongAnswers = storage.getWrongAnswers();
    const filtered = wrongAnswers.filter(wa => wa.questionId !== questionId);
    localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(filtered));
  },

  // API Key
  getApiKey: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  saveApiKey: (apiKey: string): void => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  },

  // Learning Goals
  getLearningGoals: (): LearningGoal[] => {
    const goals = localStorage.getItem(STORAGE_KEYS.LEARNING_GOALS);
    return goals ? JSON.parse(goals) : [];
  },

  saveLearningGoals: (goals: LearningGoal[]): void => {
    localStorage.setItem(STORAGE_KEYS.LEARNING_GOALS, JSON.stringify(goals));
  },

  addLearningGoal: (goal: LearningGoal): void => {
    const goals = storage.getLearningGoals();
    goals.push(goal);
    storage.saveLearningGoals(goals);
  },

  updateLearningGoal: (goalId: string, updates: Partial<LearningGoal>): void => {
    const goals = storage.getLearningGoals();
    const index = goals.findIndex(g => g.id === goalId);
    if (index >= 0) {
      goals[index] = { ...goals[index], ...updates };
      storage.saveLearningGoals(goals);
    }
  },

  // Question Notes
  getQuestionNotes: (): QuestionNote[] => {
    const notes = localStorage.getItem(STORAGE_KEYS.QUESTION_NOTES);
    return notes ? JSON.parse(notes) : [];
  },

  saveQuestionNotes: (notes: QuestionNote[]): void => {
    localStorage.setItem(STORAGE_KEYS.QUESTION_NOTES, JSON.stringify(notes));
  },

  addQuestionNote: (note: QuestionNote): void => {
    const notes = storage.getQuestionNotes();
    const existingIndex = notes.findIndex(n => n.questionId === note.questionId);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    
    storage.saveQuestionNotes(notes);
  },

  // Question Statistics
  getQuestionStats: (): QuestionStats[] => {
    const stats = localStorage.getItem(STORAGE_KEYS.QUESTION_STATS);
    return stats ? JSON.parse(stats) : [];
  },

  saveQuestionStats: (stats: QuestionStats[]): void => {
    localStorage.setItem(STORAGE_KEYS.QUESTION_STATS, JSON.stringify(stats));
  },

  updateQuestionStats: (questionId: string, isCorrect: boolean, timeSpent: number): void => {
    const stats = storage.getQuestionStats();
    const existingIndex = stats.findIndex(s => s.questionId === questionId);
    
    if (existingIndex >= 0) {
      const existing = stats[existingIndex];
      existing.attempts++;
      if (isCorrect) existing.correctCount++;
      existing.averageTime = (existing.averageTime * (existing.attempts - 1) + timeSpent) / existing.attempts;
    } else {
      stats.push({
        questionId,
        attempts: 1,
        correctCount: isCorrect ? 1 : 0,
        averageTime: timeSpent,
        difficulty: 'medium'
      });
    }
    
    storage.saveQuestionStats(stats);
  },

  // Favorite Questions
  getFavoriteQuestions: (): string[] => {
    const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITE_QUESTIONS);
    return favorites ? JSON.parse(favorites) : [];
  },

  saveFavoriteQuestions: (favorites: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.FAVORITE_QUESTIONS, JSON.stringify(favorites));
  },

  toggleFavoriteQuestion: (questionId: string): void => {
    const favorites = storage.getFavoriteQuestions();
    const index = favorites.indexOf(questionId);
    
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(questionId);
    }
    
    storage.saveFavoriteQuestions(favorites);
  },

  // Clear all data
  clearAllData: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Export/Import
  exportData: () => {
    return {
      questions: storage.getQuestions(),
      testResults: storage.getTestResults(),
      wrongAnswers: storage.getWrongAnswers(),
      learningGoals: storage.getLearningGoals(),
      questionNotes: storage.getQuestionNotes(),
      questionStats: storage.getQuestionStats(),
      favoriteQuestions: storage.getFavoriteQuestions(),
      exportedAt: new Date().toISOString(),
    };
  },

  importData: (data: any) => {
    if (data.questions) storage.saveQuestions(data.questions);
    if (data.testResults) {
      localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(data.testResults));
    }
    if (data.wrongAnswers) {
      localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(data.wrongAnswers));
    }
    if (data.learningGoals) {
      storage.saveLearningGoals(data.learningGoals);
    }
    if (data.questionNotes) {
      storage.saveQuestionNotes(data.questionNotes);
    }
    if (data.questionStats) {
      storage.saveQuestionStats(data.questionStats);
    }
    if (data.favoriteQuestions) {
      storage.saveFavoriteQuestions(data.favoriteQuestions);
    }
  },
};