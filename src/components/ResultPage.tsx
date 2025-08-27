import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  BookOpen, 
  RotateCcw, 
  Home,
  CheckCircle,
  XCircle,
  TrendingUp 
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { testUtils } from '@/utils/testUtils';
import { storage } from '@/utils/storage';

export const ResultPage: React.FC = () => {
  const { state, dispatch } = useApp();
  
  if (!state.testResult) return null;

  const result = state.testResult;
  const performance = testUtils.getPerformanceLevel(result.score);
  
  // Save test result
  React.useEffect(() => {
    storage.saveTestResult(result);
  }, [result]);

  const wrongQuestions = result.questions.filter((_, index) => 
    result.userAnswers[index] !== result.questions[index].correctAnswer
  );

  const handleRetakeTest = () => {
    dispatch({ type: 'SET_PAGE', payload: 'test-setup' });
  };

  const handleGoHome = () => {
    dispatch({ type: 'SET_PAGE', payload: 'home' });
    dispatch({ type: 'RESET_TEST' });
  };

  const handleReviewWrongAnswers = () => {
    dispatch({ type: 'SET_PAGE', payload: 'wrong-answers' });
    dispatch({ type: 'RESET_TEST' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] layout-stable">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${
            result.score >= 80 ? 'bg-green-100' :
            result.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <Trophy className={`h-12 w-12 ${
              result.score >= 80 ? 'text-green-600' :
              result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">测试完成！</h1>
        <p className="text-gray-600">以下是你的{result.category}面试题测试结果</p>
      </div>

      {/* Score Overview */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {result.score}%
            </div>
            <div className={`text-xl font-semibold ${performance.color} mb-4`}>
              {performance.level}
            </div>
            <p className="text-gray-600 max-w-md mx-auto">
              {performance.message}
            </p>
          </div>
          
          <div className="mb-6">
            <Progress value={result.score} className="w-full h-4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{result.correctAnswers}</span>
              </div>
              <p className="text-gray-600">答对题目</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-6 w-6 text-red-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {result.totalQuestions - result.correctAnswers}
                </span>
              </div>
              <p className="text-gray-600">答错题目</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {result.timeSpent ? testUtils.formatTime(result.timeSpent) : 'N/A'}
                </span>
              </div>
              <p className="text-gray-600">用时</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wrong Answers Summary */}
      {wrongQuestions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-red-600" />
              错题回顾 ({wrongQuestions.length} 题)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wrongQuestions.map((question, index) => {
                const questionIndex = result.questions.findIndex(q => q.id === question.id);
                const userAnswer = result.userAnswers[questionIndex];
                
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {question.question}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">你的答案:</span>
                        <Badge variant="destructive">
                          {userAnswer >= 0 ? String.fromCharCode(65 + userAnswer) : '未作答'}
                        </Badge>
                        {userAnswer >= 0 && (
                          <span className="text-gray-600 ml-2">
                            {question.options[userAnswer]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">正确答案:</span>
                        <Badge variant="default" className="bg-green-600">
                          {String.fromCharCode(65 + question.correctAnswer)}
                        </Badge>
                        <span className="text-gray-600 ml-2">
                          {question.options[question.correctAnswer]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleReviewWrongAnswers}
                variant="outline"
                className="w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                前往错题本深入复习
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleRetakeTest}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          重新测试
        </Button>
        
        <Button 
          onClick={handleGoHome}
          variant="outline"
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      </div>

      {/* Performance Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            学习建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            {result.score >= 90 ? (
              <div>
                <p>✅ 太棒了！你在{result.category}方面表现出色</p>
                <p>💡 建议：尝试更高难度的题目，或学习其他技术领域</p>
              </div>
            ) : result.score >= 70 ? (
              <div>
                <p>✅ 不错的表现，基础掌握良好</p>
                <p>💡 建议：重点复习错题，加强薄弱环节的练习</p>
              </div>
            ) : (
              <div>
                <p>⚠️ 还需要加强学习</p>
                <p>💡 建议：系统性复习{result.category}基础知识，多做练习题</p>
              </div>
            )}
            
            {wrongQuestions.length > 0 && (
              <p>📚 记得查看错题本，重点复习做错的{wrongQuestions.length}道题目</p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};