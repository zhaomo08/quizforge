export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  category: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  questions: Question[];
  userAnswers: number[];
  completedAt: string;
  timeSpent?: number;
}

export interface WrongAnswer {
  questionId: string;
  question: Question;
  userAnswer: number;
  wrongAt: string;
}

export interface UserStats {
  totalTests: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  categoryStats: Record<string, {
    totalTests: number;
    totalQuestions: number;
    correctAnswers: number;
    averageScore: number;
  }>;
}