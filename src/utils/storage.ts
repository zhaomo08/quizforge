/*
 * Copyright (C) 2025 saymeevetime.cn
 *
 * @author Chester
 * @date 2026-04-29
 * @description 本地存储工具 - 含内存缓存与防抖同步，避免频繁 JSON.parse 和网络请求
 */

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
} as const;

// ─── 内存缓存层（避免重复 JSON.parse）─────────────────────────────────────────
const _cache: Partial<Record<string, unknown>> = {};

function getCache<T>(key: string): T | null {
  if (key in _cache) return _cache[key] as T;
  return null;
}

function setCache(key: string, value: unknown): void {
  _cache[key] = value;
}

function invalidateCache(key: string): void {
  delete _cache[key];
}

function readStorage<T>(key: string, fallback: T): T {
  const cached = getCache<T>(key);
  if (cached !== null) return cached;

  try {
    const raw = localStorage.getItem(key);
    const value: T = raw ? (JSON.parse(raw) as T) : fallback;
    setCache(key, value);
    return value;
  } catch {
    return fallback;
  }
}

// ─── 防抖 syncToServer（800ms，合并频繁写操作）────────────────────────────────
const _syncTimers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {};

function syncToServerDebounced(key: string, data: unknown): void {
  if (_syncTimers[key]) {
    clearTimeout(_syncTimers[key]);
  }
  _syncTimers[key] = setTimeout(() => {
    delete _syncTimers[key];
    fetch(`/api/storage/${key}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => console.error('Failed to sync to server', err));
  }, 800);
}

// 后端同步方法（保留兼容旧调用）
export const syncToServer = syncToServerDebounced;

// ─── Storage API ──────────────────────────────────────────────────────────────
export const storage = {
  // 从服务端并行加载所有用户数据
  loadAllFromServer: async () => {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(
      keys.map(async (key) => {
        try {
          const res = await fetch(`/api/storage/${key}`, { credentials: 'include' });
          // 未登录(401)或服务端错误时跳过，不覆盖本地数据
          if (!res.ok) return;
          const text = await res.text();
          // 服务端返回 'null' 表示无数据，跳过
          if (!text || text === 'null') return;
          // 验证是合法 JSON 再存入
          const parsed = JSON.parse(text);
          if (key === STORAGE_KEYS.API_KEY) {
            if (typeof parsed === 'string') {
              localStorage.setItem(key, parsed);
              setCache(key, parsed);
            }
          } else {
            localStorage.setItem(key, text);
            setCache(key, parsed);
          }
        } catch (e) {
          console.error(`Failed to fetch ${key} from server`, e);
        }
      })
    );
  },

  // Questions
  getQuestions: (): Question[] => {
    return readStorage<Question[]>(STORAGE_KEYS.QUESTIONS, []);
  },

  saveQuestions: (questions: Question[]): void => {
    setCache(STORAGE_KEYS.QUESTIONS, questions);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    syncToServerDebounced(STORAGE_KEYS.QUESTIONS, questions);
  },

  addQuestions: (newQuestions: Question[]): void => {
    const existingQuestions = storage.getQuestions();
    const updatedQuestions = [...existingQuestions, ...newQuestions];
    storage.saveQuestions(updatedQuestions);
  },

  getQuestionsByCategory: (category: string): Question[] => {
    // 复用已缓存的 questions，不重复读取 localStorage
    return storage.getQuestions().filter((q) => q.category === category);
  },

  // Test Results
  getTestResults: (): TestResult[] => {
    return readStorage<TestResult[]>(STORAGE_KEYS.TEST_RESULTS, []);
  },

  saveTestResult: (result: TestResult): void => {
    const results = storage.getTestResults();
    results.push(result);
    setCache(STORAGE_KEYS.TEST_RESULTS, results);
    localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(results));
    syncToServerDebounced(STORAGE_KEYS.TEST_RESULTS, results);
  },

  // Wrong Answers
  getWrongAnswers: (): WrongAnswer[] => {
    return readStorage<WrongAnswer[]>(STORAGE_KEYS.WRONG_ANSWERS, []);
  },

  addWrongAnswer: (wrongAnswer: WrongAnswer): void => {
    const wrongAnswers = storage.getWrongAnswers();
    const existingIndex = wrongAnswers.findIndex(
      (wa) => wa.questionId === wrongAnswer.questionId
    );

    if (existingIndex >= 0) {
      wrongAnswers[existingIndex] = wrongAnswer;
    } else {
      wrongAnswers.push(wrongAnswer);
    }

    setCache(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers);
    localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
    syncToServerDebounced(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers);
  },

  removeWrongAnswer: (questionId: string): void => {
    const wrongAnswers = storage.getWrongAnswers();
    const filtered = wrongAnswers.filter((wa) => wa.questionId !== questionId);
    setCache(STORAGE_KEYS.WRONG_ANSWERS, filtered);
    localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(filtered));
    syncToServerDebounced(STORAGE_KEYS.WRONG_ANSWERS, filtered);
  },

  // API Key
  getApiKey: (): string | null => {
    return readStorage<string | null>(STORAGE_KEYS.API_KEY, null);
  },

  saveApiKey: (apiKey: string): void => {
    setCache(STORAGE_KEYS.API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    syncToServerDebounced(STORAGE_KEYS.API_KEY, apiKey);
  },

  // Learning Goals
  getLearningGoals: (): LearningGoal[] => {
    return readStorage<LearningGoal[]>(STORAGE_KEYS.LEARNING_GOALS, []);
  },

  saveLearningGoals: (goals: LearningGoal[]): void => {
    setCache(STORAGE_KEYS.LEARNING_GOALS, goals);
    localStorage.setItem(STORAGE_KEYS.LEARNING_GOALS, JSON.stringify(goals));
    syncToServerDebounced(STORAGE_KEYS.LEARNING_GOALS, goals);
  },

  addLearningGoal: (goal: LearningGoal): void => {
    const goals = storage.getLearningGoals();
    goals.push(goal);
    storage.saveLearningGoals(goals);
  },

  updateLearningGoal: (goalId: string, updates: Partial<LearningGoal>): void => {
    const goals = storage.getLearningGoals();
    const index = goals.findIndex((g) => g.id === goalId);
    if (index >= 0) {
      goals[index] = { ...goals[index]!, ...updates } as LearningGoal;
      storage.saveLearningGoals(goals);
    }
  },

  // Question Notes
  getQuestionNotes: (): QuestionNote[] => {
    return readStorage<QuestionNote[]>(STORAGE_KEYS.QUESTION_NOTES, []);
  },

  saveQuestionNotes: (notes: QuestionNote[]): void => {
    setCache(STORAGE_KEYS.QUESTION_NOTES, notes);
    localStorage.setItem(STORAGE_KEYS.QUESTION_NOTES, JSON.stringify(notes));
    syncToServerDebounced(STORAGE_KEYS.QUESTION_NOTES, notes);
  },

  addQuestionNote: (note: QuestionNote): void => {
    const notes = storage.getQuestionNotes();
    const existingIndex = notes.findIndex((n) => n.questionId === note.questionId);

    if (existingIndex >= 0) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }

    storage.saveQuestionNotes(notes);
  },

  // Question Statistics
  getQuestionStats: (): QuestionStats[] => {
    return readStorage<QuestionStats[]>(STORAGE_KEYS.QUESTION_STATS, []);
  },

  saveQuestionStats: (stats: QuestionStats[]): void => {
    setCache(STORAGE_KEYS.QUESTION_STATS, stats);
    localStorage.setItem(STORAGE_KEYS.QUESTION_STATS, JSON.stringify(stats));
    syncToServerDebounced(STORAGE_KEYS.QUESTION_STATS, stats);
  },

  updateQuestionStats: (questionId: string, isCorrect: boolean, timeSpent: number): void => {
    const stats = storage.getQuestionStats();
    const existingIndex = stats.findIndex((s) => s.questionId === questionId);

    if (existingIndex >= 0) {
      const existing = stats[existingIndex]!;
      existing.attempts++;
      if (isCorrect) existing.correctCount++;
      existing.averageTime =
        (existing.averageTime * (existing.attempts - 1) + timeSpent) / existing.attempts;
    } else {
      stats.push({
        questionId,
        attempts: 1,
        correctCount: isCorrect ? 1 : 0,
        averageTime: timeSpent,
        difficulty: 'medium',
      });
    }

    storage.saveQuestionStats(stats);
  },

  // Favorite Questions
  getFavoriteQuestions: (): string[] => {
    return readStorage<string[]>(STORAGE_KEYS.FAVORITE_QUESTIONS, []);
  },

  saveFavoriteQuestions: (favorites: string[]): void => {
    setCache(STORAGE_KEYS.FAVORITE_QUESTIONS, favorites);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_QUESTIONS, JSON.stringify(favorites));
    syncToServerDebounced(STORAGE_KEYS.FAVORITE_QUESTIONS, favorites);
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
    Object.values(STORAGE_KEYS).forEach((key) => {
      invalidateCache(key);
      localStorage.removeItem(key);
      syncToServerDebounced(key, null);
    });
  },

  clearLocalData: (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      invalidateCache(key);
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

  importData: (data: Record<string, unknown>) => {
    if (data.questions) {
      storage.saveQuestions(data.questions as Question[]);
    }
    if (data.testResults) {
      const testResults = data.testResults as TestResult[];
      setCache(STORAGE_KEYS.TEST_RESULTS, testResults);
      localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(testResults));
    }
    if (data.wrongAnswers) {
      const wrongAnswers = data.wrongAnswers as WrongAnswer[];
      setCache(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers);
      localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
    }
    if (data.learningGoals) {
      storage.saveLearningGoals(data.learningGoals as LearningGoal[]);
    }
    if (data.questionNotes) {
      storage.saveQuestionNotes(data.questionNotes as QuestionNote[]);
    }
    if (data.questionStats) {
      storage.saveQuestionStats(data.questionStats as QuestionStats[]);
    }
    if (data.favoriteQuestions) {
      storage.saveFavoriteQuestions(data.favoriteQuestions as string[]);
    }
  },
};