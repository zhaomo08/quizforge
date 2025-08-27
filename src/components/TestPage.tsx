import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { testUtils } from '@/utils/testUtils';

export const TestPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [timeLeft, setTimeLeft] = useState(60);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number>(-1);

  const currentTest = state.currentTest;
  if (!currentTest) return null;

  const currentQuestion = currentTest.questions[currentTest.currentQuestionIndex];
  const progress = ((currentTest.currentQuestionIndex + 1) / currentTest.questions.length) * 100;
  const isLastQuestion = currentTest.currentQuestionIndex === currentTest.questions.length - 1;

  // Timer effect
  useEffect(() => {
    if (!showAnswer && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showAnswer) {
      handleTimeUp();
    }
  }, [timeLeft, showAnswer]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(60);
    setShowAnswer(false);
    setSelectedAnswer(-1);
  }, [currentTest.currentQuestionIndex]);

  const handleTimeUp = () => {
    if (selectedAnswer !== -1) {
      handleAnswer(selectedAnswer);
    } else {
      // Auto submit with no answer
      handleAnswer(-1);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);
    dispatch({ type: 'ANSWER_QUESTION', payload: answerIndex });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      finishTest();
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const finishTest = () => {
    const timeSpent = Math.round((Date.now() - currentTest.startTime) / 1000);
    const result = testUtils.calculateResult(
      currentTest.questions,
      currentTest.userAnswers,
      state.selectedCategory,
      timeSpent
    );
    
    testUtils.saveWrongAnswers(result);
    dispatch({ type: 'FINISH_TEST', payload: result });
  };

  const getAnswerStyle = (optionIndex: number) => {
    if (!showAnswer) {
      return selectedAnswer === optionIndex 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300';
    }
    
    if (optionIndex === currentQuestion.correctAnswer) {
      return 'border-green-500 bg-green-50 text-green-900';
    }
    
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
      return 'border-red-500 bg-red-50 text-red-900';
    }
    
    return 'border-gray-200';
  };

  const getAnswerIcon = (optionIndex: number) => {
    if (!showAnswer) return null;
    
    if (optionIndex === currentQuestion.correctAnswer) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] layout-stable">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              题目 {currentTest.currentQuestionIndex + 1} / {currentTest.questions.length}
            </h1>
            <p className="text-gray-600">{state.selectedCategory} 面试题</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className={timeLeft <= 10 ? 'text-red-600 font-semibold' : ''}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Badge variant="outline">
              {currentQuestion.difficulty || 'medium'}
            </Badge>
          </div>
        </div>
        
        <Progress value={progress} className="w-full h-2" />
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${getAnswerStyle(index)}`}
                onClick={() => !showAnswer && handleAnswer(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                  </div>
                  {getAnswerIcon(index)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      {showAnswer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              {selectedAnswer === currentQuestion.correctAnswer ? '回答正确！' : '回答错误'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {showAnswer ? (
          <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
            {isLastQuestion ? '查看结果' : '下一题'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">
              选择答案后将显示解析，或等待倒计时结束
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};