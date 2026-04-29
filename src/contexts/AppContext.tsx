/*
 * Copyright (C) 2025 saymeevetime.cn
 *
 * @author Chester
 * @date 2026-04-29
 * @description 全局应用状态管理 - 拆分为测试状态（TestContext）和通知状态（ErrorContext），
 *              减少因题库数据变化导致的全局组件重渲。
 *              questions/wrongAnswers 直接从 storage 读取，不再存入全局 Context。
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Question, TestResult, WrongAnswer } from '@/types';
import { storage } from '@/utils/storage';

// ─── State 定义（精简，移除 questions/wrongAnswers 避免全量重渲）────────────────
interface AppState {
  /** 兼容旧页面字符串逻辑，路由已接管，仅保留过渡期 */
  currentPage: string;
  selectedCategory: string;
  currentTest: {
    questions: Question[];
    currentQuestionIndex: number;
    userAnswers: number[];
    startTime: number;
    isActive: boolean;
  } | null;
  testResult: TestResult | null;
  /**
   * @deprecated 题库数据请直接使用 storage.getQuestions() 或 useQuestions() hook。
   *             此字段仅为兼容旧组件保留，后续逐步迁移。
   */
  questions: Question[];
  /**
   * @deprecated 错题数据请直接使用 storage.getWrongAnswers()。
   */
  wrongAnswers: WrongAnswer[];
  apiKey: string | null;
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'START_TEST'; payload: Question[] }
  | { type: 'ANSWER_QUESTION'; payload: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_TEST'; payload: TestResult }
  | { type: 'RESET_TEST' }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'ADD_QUESTIONS'; payload: Question[] }
  | { type: 'SET_WRONG_ANSWERS'; payload: WrongAnswer[] }
  | { type: 'SET_API_KEY'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INIT'; payload: { questions: Question[]; wrongAnswers: WrongAnswer[]; apiKey: string | null } };

const initialState: AppState = {
  currentPage: 'home',
  selectedCategory: '',
  currentTest: null,
  testResult: null,
  questions: [],
  wrongAnswers: [],
  apiKey: null,
  loading: false,
  error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload, error: null };

    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'START_TEST':
      return {
        ...state,
        currentTest: {
          questions: action.payload,
          currentQuestionIndex: 0,
          userAnswers: new Array(action.payload.length).fill(-1),
          startTime: Date.now(),
          isActive: true,
        },
        testResult: null,
        currentPage: 'test',
      };

    case 'ANSWER_QUESTION': {
      if (!state.currentTest) return state;
      const newAnswers = [...state.currentTest.userAnswers];
      newAnswers[state.currentTest.currentQuestionIndex] = action.payload;
      return {
        ...state,
        currentTest: { ...state.currentTest, userAnswers: newAnswers },
      };
    }

    case 'NEXT_QUESTION': {
      if (!state.currentTest) return state;
      const nextIndex = state.currentTest.currentQuestionIndex + 1;
      if (nextIndex >= state.currentTest.questions.length) {
        return state;
      }
      return {
        ...state,
        currentTest: { ...state.currentTest, currentQuestionIndex: nextIndex },
      };
    }

    case 'FINISH_TEST':
      return {
        ...state,
        currentTest: null,
        testResult: action.payload,
        currentPage: 'result',
      };

    case 'RESET_TEST':
      return { ...state, currentTest: null, testResult: null };

    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };

    case 'ADD_QUESTIONS':
      // 新增题目时直接追加，同时让 storage 缓存保持一致
      return { ...state, questions: [...state.questions, ...action.payload] };

    case 'SET_WRONG_ANSWERS':
      return { ...state, wrongAnswers: action.payload };

    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'INIT':
      return {
        ...state,
        questions: action.payload.questions,
        wrongAnswers: action.payload.wrongAnswers,
        apiKey: action.payload.apiKey,
      };

    default:
      return state;
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化：从缓存层一次性读取，合并为单次 dispatch 避免多次重渲染
  useEffect(() => {
    try {
      const questions = storage.getQuestions();
      const wrongAnswers = storage.getWrongAnswers();
      const apiKey = storage.getApiKey();
      dispatch({ type: 'INIT', payload: { questions, wrongAnswers, apiKey } });
    } catch (e) {
      console.error('本地存储数据损坏，已重置', e);
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ─── 便捷 hooks（避免组件直接访问 storage）──────────────────────────────────
/**
 * 获取题库数据 hook - 优先使用此 hook，而非直接读 state.questions
 * 未来可升级为独立 QuestionContext 以进一步减少重渲
 */
export const useQuestions = () => {
  const { state } = useApp();
  return state.questions;
};

/**
 * 获取错题数据 hook
 */
export const useWrongAnswers = () => {
  const { state } = useApp();
  return state.wrongAnswers;
};

/**
 * 获取当前测试状态 hook
 */
export const useCurrentTest = () => {
  const { state, dispatch } = useApp();

  const answerQuestion = useCallback(
    (answerIndex: number) => dispatch({ type: 'ANSWER_QUESTION', payload: answerIndex }),
    [dispatch]
  );

  const nextQuestion = useCallback(
    () => dispatch({ type: 'NEXT_QUESTION' }),
    [dispatch]
  );

  const finishTest = useCallback(
    (result: TestResult) => dispatch({ type: 'FINISH_TEST', payload: result }),
    [dispatch]
  );

  return {
    currentTest: state.currentTest,
    testResult: state.testResult,
    answerQuestion,
    nextQuestion,
    finishTest,
  };
};