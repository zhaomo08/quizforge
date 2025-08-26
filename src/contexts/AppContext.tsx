import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Question, TestResult, WrongAnswer } from '@/types';
import { storage } from '@/utils/storage';

interface AppState {
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
  questions: Question[];
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
  | { type: 'CLEAR_ERROR' };

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
    
    case 'ANSWER_QUESTION':
      if (!state.currentTest) return state;
      
      const newAnswers = [...state.currentTest.userAnswers];
      newAnswers[state.currentTest.currentQuestionIndex] = action.payload;
      
      return {
        ...state,
        currentTest: {
          ...state.currentTest,
          userAnswers: newAnswers,
        },
      };
    
    case 'NEXT_QUESTION':
      if (!state.currentTest) return state;
      
      const nextIndex = state.currentTest.currentQuestionIndex + 1;
      if (nextIndex >= state.currentTest.questions.length) {
        return state; // Should trigger finish test
      }
      
      return {
        ...state,
        currentTest: {
          ...state.currentTest,
          currentQuestionIndex: nextIndex,
        },
      };
    
    case 'FINISH_TEST':
      return {
        ...state,
        currentTest: null,
        testResult: action.payload,
        currentPage: 'result',
      };
    
    case 'RESET_TEST':
      return {
        ...state,
        currentTest: null,
        testResult: null,
      };
    
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    
    case 'ADD_QUESTIONS':
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
    
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data
  useEffect(() => {
    const questions = storage.getQuestions();
    const wrongAnswers = storage.getWrongAnswers();
    const apiKey = storage.getApiKey();

    dispatch({ type: 'SET_QUESTIONS', payload: questions });
    dispatch({ type: 'SET_WRONG_ANSWERS', payload: wrongAnswers });
    dispatch({ type: 'SET_API_KEY', payload: apiKey });
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