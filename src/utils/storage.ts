import { Question, TestResult, WrongAnswer } from '@/types';

const STORAGE_KEYS = {
  QUESTIONS: 'interview_questions',
  TEST_RESULTS: 'test_results',
  WRONG_ANSWERS: 'wrong_answers',
  API_KEY: 'openai_api_key',
  USER_PREFERENCES: 'user_preferences',
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
  },
};