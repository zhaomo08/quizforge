import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  BookOpen,
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  Pause,
  Play,
  SkipForward,
  Heart,
  AlertTriangle,
  TrendingUp,
  Target
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  // 新增状态 - 答题体验优化
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(new Set());
  const [questionNotes, setQuestionNotes] = useState<QuestionNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(true);
  const [questionStats, setQuestionStats] = useState<QuestionStats[]>([]);
  
  // 动画和视觉效果
  const [answerAnimation, setAnswerAnimation] = useState('');
  const [progressAnimation, setProgressAnimation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 检查是否有当前测试
  if (!state.currentTest) {
    dispatch({ type: 'SET_PAGE', payload: 'home' });
    return null;
  }

  const currentQuestion = state.currentTest.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / state.currentTest.questions.length) * 100;
  const questionId = `${currentQuestion.question}_${currentQuestionIndex}`;

  // 加载用户数据
  useEffect(() => {
    const savedFavorites = storage.getFavoriteQuestions();
    const savedNotes = storage.getQuestionNotes();
    const savedStats = storage.getQuestionStats();
    
    setFavoriteQuestions(new Set(savedFavorites));
    setQuestionNotes(savedNotes);
    setQuestionStats(savedStats);
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (timeLeft > 0 && !showAnswer && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showAnswer) {
      handleAnswer('', true); // 超时自动提交
    }
  }, [timeLeft, showAnswer, isPaused]);

  // 进度动画
  useEffect(() => {
    setProgressAnimation(true);
    const timer = setTimeout(() => setProgressAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: string, isTimeout: boolean = false) => {
    const questionTime = Date.now() - questionStartTime;
    
    setSelectedAnswer(answer);
    setShowAnswer(true);
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
    
    // 记录答题统计
    updateQuestionStats(questionId, answer, questionTime);
    
    // 答案动画效果
    const isCorrect = answer ? answer.charCodeAt(0) - 65 === currentQuestion.correctAnswer : false;
    setAnswerAnimation(isCorrect ? 'correct' : 'incorrect');
    
    // 震动反馈（移动设备）
    if (navigator.vibrate && !isCorrect) {
      navigator.vibrate([100, 50, 100]);
    }
    
    setTimeout(() => setAnswerAnimation(''), 1000);
  };

  const updateQuestionStats = (questionId: string, answer: string, time: number) => {
    const isCorrect = answer ? answer.charCodeAt(0) - 65 === currentQuestion.correctAnswer : false;
    
    setQuestionStats(prev => {
      const existing = prev.find(s => s.questionId === questionId);
      if (existing) {
        return prev.map(s => s.questionId === questionId ? {
          ...s,
          attempts: s.attempts + 1,
          correctCount: s.correctCount + (isCorrect ? 1 : 0),
          averageTime: (s.averageTime * s.attempts + time) / (s.attempts + 1)
        } : s);
      } else {
        return [...prev, {
          questionId,
          attempts: 1,
          correctCount: isCorrect ? 1 : 0,
          averageTime: time,
          difficulty: 'medium' // 默认难度
        }];
      }
    });
  };

  const handleNext = () => {
    // 保存当前题目的笔记
    if (currentNote.trim()) {
      saveQuestionNote();
    }
    
    if (currentQuestionIndex < state.currentTest!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowAnswer(false);
      setTimeLeft(60);
      setQuestionStartTime(Date.now());
      setShowHint(false);
      setHintLevel(0);
      setCurrentNote('');
      setShowNoteInput(false);
      setConfidence(0);
      
      // 滚动到顶部
      if (cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    if (!state.currentTest) return;
    
    // 保存所有数据
    storage.saveQuestionStats(questionStats);
    storage.saveQuestionNotes(questionNotes);
    storage.saveFavoriteQuestions(Array.from(favoriteQuestions));
    
    // 转换答案格式
    const userAnswers: number[] = [];
    state.currentTest.questions.forEach((_, index) => {
      const userAnswer = answers[index] || '';
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

  const getHint = () => {
    const hints = [
      "仔细阅读题目，注意关键词",
      "排除明显错误的选项",
      "考虑题目涉及的核心概念",
      `正确答案在选项 ${String.fromCharCode(65 + currentQuestion.correctAnswer)} 中`
    ];
    
    if (hintLevel < hints.length - 1) {
      setHintLevel(hintLevel + 1);
      setShowHint(true);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 获取时间颜色
  const getTimeColor = () => {
    if (timeLeft > 30) return 'text-green-600';
    if (timeLeft > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取进度颜色
  const getProgressColor = () => {
    if (progress < 30) return 'bg-blue-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedAnswerIndex = selectedAnswer ? selectedAnswer.charCodeAt(0) - 65 : -1;
  const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer;
  const currentQuestionNote = questionNotes.find(n => n.questionId === questionId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="page-container layout-stable">
        <div className="max-w-4xl mx-auto">
          {/* 增强的头部 */}
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              退出测试
            </Button>
            
            <div className="flex items-center space-x-4">
              {/* 暂停/继续按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="flex items-center"
              >
                {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                {isPaused ? '继续' : '暂停'}
              </Button>
              
              {/* 时间显示 */}
              <Badge variant="outline" className={`flex items-center ${getTimeColor()}`}>
                <Clock className="h-3 w-3 mr-1" />
                {isPaused ? '已暂停' : `${timeLeft}s`}
              </Badge>
              
              {/* 进度显示 */}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {currentQuestionIndex + 1} / {state.currentTest.questions.length}
              </span>
            </div>
          </div>

          {/* 增强的进度条 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                答题进度
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
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

          {/* 主要答题卡片 */}
          <Card 
            ref={cardRef}
            className={`mb-6 transition-all duration-300 ${answerAnimation === 'correct' ? 'ring-2 ring-green-500 bg-green-50' : answerAnimation === 'incorrect' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
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
                  {!showAnswer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={getHint}
                      disabled={hintLevel >= 3}
                      className="text-yellow-500"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  )}
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
                        {hintLevel === 1 && "仔细阅读题目，注意关键词"}
                        {hintLevel === 2 && "排除明显错误的选项"}
                        {hintLevel === 3 && "考虑题目涉及的核心概念"}
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
                  const isCorrectOption = index === currentQuestion.correctAnswer;
                  
                  let buttonClass = "w-full text-left p-4 border rounded-lg transition-all duration-200 hover:shadow-md ";
                  
                  if (showAnswer) {
                    if (isCorrectOption) {
                      buttonClass += "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200";
                    } else if (isSelected && !isCorrectOption) {
                      buttonClass += "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200";
                    } else {
                      buttonClass += "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400";
                    }
                  } else {
                    if (isSelected) {
                      buttonClass += "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-200";
                    } else {
                      buttonClass += "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showAnswer && !isPaused && handleAnswer(optionLetter)}
                      disabled={showAnswer || isPaused}
                      className={buttonClass}
                    >
                      <div className="flex items-center">
                        <span className="font-semibold mr-3 min-w-[32px] h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          {optionLetter}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showAnswer && isCorrectOption && (
                          <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                        )}
                        {showAnswer && isSelected && !isCorrectOption && (
                          <XCircle className="h-5 w-5 text-red-600 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 信心度选择 */}
              {!showAnswer && selectedAnswer && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    你对这个答案的信心程度:
                  </p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfidence(level)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          confidence >= level 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <Star className={`h-4 w-4 mx-auto ${confidence >= level ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 答案解析 */}
              {showAnswer && (
                <div className="mt-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '回答正确！' : '回答错误'}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExplanation(!showExplanation)}
                    >
                      {showExplanation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>正确答案：</strong>
                        {String.fromCharCode(65 + currentQuestion.correctAnswer)} - {currentQuestion.options[currentQuestion.correctAnswer]}
                      </div>
                    </div>
                    
                    {showExplanation && currentQuestion.explanation && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">解析:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          {showAnswer && (
            <div className="text-center animate-fade-in">
              <div className="flex justify-center space-x-4">
                {currentQuestionIndex < state.currentTest.questions.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 跳过当前题目
                      handleNext();
                    }}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    跳过
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  {currentQuestionIndex < state.currentTest.questions.length - 1 ? '下一题' : '查看结果'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};