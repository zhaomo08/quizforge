import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  MessageSquare,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { TestResult } from '@/types';
import { storage } from '@/utils/storage';
import { testUtils } from '@/utils/testUtils';

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

export const EnhancedTestPage: React.FC = () => {
  const { state, dispatch } = useApp();
  // ── 状态声明 ──────────────────────────────────────────
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime] = useState(Date.now());

  // 功能状态
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(new Set());
  const [questionNotes, setQuestionNotes] = useState<QuestionNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);

  // 动画状态
  const [answerAnimation, setAnswerAnimation] = useState('');
  const [progressAnimation, setProgressAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── 所有 useEffect 必须在条件 return 之前 ──────────────
  // 无活动测试时重定向
  useEffect(() => {
    if (!state.currentTest) {
      navigate('/');
    }
  }, [state.currentTest, navigate]);

  // 加载用户数据
  useEffect(() => {
    const savedFavorites = storage.getFavoriteQuestions();
    const savedNotes = storage.getQuestionNotes();
    const savedStats = storage.getQuestionStats();
    setFavoriteQuestions(new Set(savedFavorites));
    setQuestionNotes(savedNotes);
    setQuestionStats(savedStats);
  }, []);

  // 进度动画
  useEffect(() => {
    setProgressAnimation(true);
    const timer = setTimeout(() => setProgressAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  // ── 条件 return 必须在所有 Hook 之后 ──────────────────
  if (!state.currentTest) return null;

  const currentQuestion = state.currentTest.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / state.currentTest.questions.length) * 100;
  if (!currentQuestion) return null;

  const questionId = currentQuestion.id;
  const currentQuestionNote = questionNotes.find(n => n.questionId === questionId);

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);

    const isCorrect = answer ? answer.charCodeAt(0) - 65 === currentQuestion.correctAnswer : false;
    const answerIndex = answer ? answer.charCodeAt(0) - 65 : -1;
    dispatch({ type: 'ANSWER_QUESTION', payload: answerIndex });

    setAnswerAnimation(isCorrect ? 'correct' : 'incorrect');
    if (navigator.vibrate && !isCorrect) navigator.vibrate([60]);
    setTimeout(() => setAnswerAnimation(''), 600);

    // 更新答题统计
    setQuestionStats(prev => {
      const existing = prev.find(s => s.questionId === questionId);
      if (existing) {
        return prev.map(s => s.questionId === questionId ? {
          ...s,
          attempts: s.attempts + 1,
          correctCount: s.correctCount + (isCorrect ? 1 : 0),
          averageTime: 0,
        } : s);
      }
      return [...prev, { questionId, attempts: 1, correctCount: isCorrect ? 1 : 0, averageTime: 0, difficulty: 'medium' as const }];
    });

    handleNext(newAnswers);
  };

  const handleNext = (currentAnswers?: Record<number, string>) => {
    if (currentNote.trim()) saveQuestionNote();

    if (currentQuestionIndex < state.currentTest!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setShowHint(false);
      setHintLevel(0);
      setCurrentNote('');
      setShowNoteInput(false);
      if (cardRef.current) cardRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      finishTest(currentAnswers || answers);
    }
  };

  const finishTest = (finalAnswers: Record<number, string>) => {
    if (!state.currentTest) return;
    
    // 保存所有数据
    storage.saveQuestionStats(questionStats);
    storage.saveQuestionNotes(questionNotes);
    storage.saveFavoriteQuestions(Array.from(favoriteQuestions));
    
    // 转换答案格式
    const userAnswers: number[] = [];
    state.currentTest.questions.forEach((_, index) => {
      const userAnswer = finalAnswers[index] || '';
      if (userAnswer) {
        userAnswers[index] = userAnswer.charCodeAt(0) - 65;
      } else {
        userAnswers[index] = -1;
      }
    });

    const correctCount = state.currentTest.questions.reduce((count, question, index) => {
      return count + (question.correctAnswer === userAnswers[index] ? 1 : 0);
    }, 0);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.round((correctCount / state.currentTest.questions.length) * 100);

    const testResult: TestResult = {
      id: `test_${Date.now()}`,
      category: state.selectedCategory,
      totalQuestions: state.currentTest.questions.length,
      correctAnswers: correctCount,
      score,
      questions: state.currentTest.questions,
      userAnswers,
      completedAt: new Date().toISOString(),
      timeSpent: timeTaken,
    };

    storage.saveTestResult(testResult);
    testUtils.saveWrongAnswers(testResult);

    dispatch({
      type: 'FINISH_TEST',
      payload: testResult
    });
    // 路由跳转到结果页
    navigate('/result');
  };

  const toggleFavorite = () => {
    const newFavorites = new Set(favoriteQuestions);
    if (newFavorites.has(questionId)) {
      newFavorites.delete(questionId);
    } else {
      newFavorites.add(questionId);
    }
    setFavoriteQuestions(newFavorites);
  };

  const saveQuestionNote = () => {
    if (!currentNote.trim()) return;
    
    const note: QuestionNote = {
      questionId,
      note: currentNote.trim(),
      timestamp: Date.now()
    };
    
    setQuestionNotes(prev => {
      const filtered = prev.filter(n => n.questionId !== questionId);
      return [...filtered, note];
    });
    
    setShowNoteInput(false);
  };

  const HINTS = [
    "仔细阅读题目，注意关键词",
    "排除明显错误的选项",
    "考虑题目涉及的核心概念",
    `正确答案在选项 ${String.fromCharCode(65 + currentQuestion.correctAnswer)} 中`,
  ];

  const getHint = () => {
    if (hintLevel < HINTS.length - 1) {
      setHintLevel(hintLevel + 1);
      setShowHint(true);
    }
  };

  const getProgressColor = () => {
    if (progress < 30) return 'bg-blue-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 退出确认弹窗 */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认退出测试？</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              退出后当前答题进度将丢失，已答 {Object.keys(answers).length} 题 / 共 {state.currentTest.questions.length} 题。
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExitDialog(false)}>
                继续答题
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => { dispatch({ type: 'RESET_TEST' }); navigate('/'); }}
              >
                确认退出
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="page-container layout-stable">
        <div className="max-w-4xl mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Button
              variant="ghost"
              onClick={() => setShowExitDialog(true)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              退出测试
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {currentQuestionIndex + 1} / {state.currentTest.questions.length}
            </span>
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">答题进度</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress
                value={progress}
                className={`h-3 transition-all duration-500 ${progressAnimation ? 'animate-pulse' : ''}`}
              />
              <div
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 答题卡片 */}
          <Card
            ref={cardRef}
            className={`mb-6 transition-all duration-300 ${answerAnimation === 'correct' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' : answerAnimation === 'incorrect' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl flex-1">
                  第 {currentQuestionIndex + 1} 题
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* 收藏按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    className={favoriteQuestions.has(questionId) ? 'text-red-500' : 'text-gray-400'}
                  >
                    <Heart className={`h-4 w-4 ${favoriteQuestions.has(questionId) ? 'fill-current' : ''}`} />
                  </Button>
                  
                  {/* 笔记按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className={currentQuestionNote ? 'text-blue-500' : 'text-gray-400'}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  
                  {/* 提示按钮 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={getHint}
                    disabled={hintLevel >= 3}
                    className="text-yellow-500"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* 题目内容 */}
              <div className="mb-6">
                <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                  {currentQuestion.question}
                </p>
              </div>

              {/* 提示信息 */}
              {showHint && hintLevel > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        提示 {hintLevel}:
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {HINTS[hintLevel - 1]}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 笔记输入 */}
              {showNoteInput && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      添加笔记:
                    </label>
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="记录你的思考过程或疑问..."
                      className="w-full p-2 text-sm border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={saveQuestionNote}>
                        保存
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNoteInput(false)}>
                        取消
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 显示已有笔记 */}
              {currentQuestionNote && !showNoteInput && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">我的笔记:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{currentQuestionNote.note}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 选项 */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswer === optionLetter;
                  // const isCorrectOption = index === currentQuestion.correctAnswer; // 未使用
                  
                  let buttonClass = "w-full text-left p-4 border rounded-lg transition-all duration-200 hover:shadow-md ";
                  
                  if (isSelected) {
                    buttonClass += "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-200";
                  } else {
                    buttonClass += "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(optionLetter)}
                      className={buttonClass}
                    >
                      <div className="flex items-center">
                        <span className="font-semibold mr-3 min-w-[32px] h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          {optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                        {/* 立即跳转模式：不在题目界面显示对错图标 */}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 信心度选择 */}
              {/* 答案解析 */}
              {/* 立即跳转模式：不显示答案解析区 */}
            </CardContent>
          </Card>

          {/* 立即跳转模式：无底部提示 */}
        </div>
      </div>
    </div>
  );
};