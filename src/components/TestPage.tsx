// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { TestResult } from '@/types';
import { storage } from '@/utils/storage';
import { testUtils } from '@/utils/testUtils';

export const TestPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime] = useState(Date.now());

  // 检查是否有当前测试
  if (!state.currentTest) {
    dispatch({ type: 'SET_PAGE', payload: 'home' });
    return null;
  }

  const currentQuestion = state.currentTest.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / state.currentTest.questions.length) * 100;

  useEffect(() => {
    if (timeLeft > 0 && !showAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showAnswer) {
      handleAnswer('');
    }
  }, [timeLeft, showAnswer]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowAnswer(true);
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < state.currentTest!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowAnswer(false);
      setTimeLeft(60);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    if (!state.currentTest) return;
    
    // 转换答案格式：从字母转换为数字索引
    const userAnswers: number[] = [];
    state.currentTest.questions.forEach((_, index) => {
      const userAnswer = answers[index] || '';
      if (userAnswer) {
        // 将字母答案转换为数字索引 (A=0, B=1, C=2, D=3)
        userAnswers[index] = userAnswer.charCodeAt(0) - 65;
      } else {
        userAnswers[index] = -1; // 未回答
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

    // 保存测试结果
    storage.saveTestResult(testResult);
    
    // 保存错题
    testUtils.saveWrongAnswers(testResult);

    dispatch({
      type: 'FINISH_TEST',
      payload: testResult
    });
  };

  // 将字母答案转换为数字进行比较
  const selectedAnswerIndex = selectedAnswer ? selectedAnswer.charCodeAt(0) - 65 : -1;
  const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer;

  return (
    <div className="page-container layout-stable">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            退出测试
          </Button>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft}s
            </Badge>
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {state.currentTest.questions.length}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              第 {currentQuestionIndex + 1} 题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const isSelected = selectedAnswer === optionLetter;
                const isCorrectOption = index === currentQuestion.correctAnswer;
                
                let buttonClass = "w-full text-left p-4 border rounded-lg transition-all duration-200 ";
                
                if (showAnswer) {
                  if (isCorrectOption) {
                    buttonClass += "bg-green-50 border-green-500 text-green-800";
                  } else if (isSelected && !isCorrectOption) {
                    buttonClass += "bg-red-50 border-red-500 text-red-800";
                  } else {
                    buttonClass += "bg-gray-50 border-gray-300 text-gray-600";
                  }
                } else {
                  if (isSelected) {
                    buttonClass += "bg-blue-50 border-blue-500 text-blue-800";
                  } else {
                    buttonClass += "bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showAnswer && handleAnswer(optionLetter)}
                    disabled={showAnswer}
                    className={buttonClass}
                  >
                    <div className="flex items-center">
                      <span className="font-semibold mr-3 min-w-[24px]">
                        {optionLetter}.
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

            {showAnswer && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in">
                <div className="flex items-center mb-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>正确答案：</strong>{String.fromCharCode(65 + currentQuestion.correctAnswer)} - {currentQuestion.options[currentQuestion.correctAnswer]}
                </div>
                {currentQuestion.explanation && (
                  <div className="mt-2 text-sm text-gray-700">
                    <strong>解析：</strong>{currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {showAnswer && (
          <div className="text-center animate-fade-in">
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {currentQuestionIndex < state.currentTest.questions.length - 1 ? '下一题' : '查看结果'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};