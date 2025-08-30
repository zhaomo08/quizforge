import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, RotateCcw, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export const ResultPage: React.FC = () => {
  const { state, dispatch } = useApp();
  
  if (!state.testResult) {
    return null;
  }

  const { correctAnswers, totalQuestions, score, timeSpent } = state.testResult;
  
  // 计算错题
  const wrongAnswers = state.testResult.questions.filter((question, index) => {
    return question.correctAnswer !== state.testResult!.userAnswers[index];
  });
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="page-container layout-stable">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            测试完成！
          </h1>
          <p className="text-gray-600 text-lg">
            恭喜你完成了这次测试，查看你的成绩吧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{correctAnswers}/{totalQuestions}</div>
              <div className="text-sm text-gray-500">答对题数</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${getScoreColor(score)}`}>
                {score}%
              </div>
              <div className="text-sm text-gray-500">正确率</div>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatTime(timeSpent || 0)}</div>
              <div className="text-sm text-gray-500">用时</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>成绩分析</span>
              <Badge variant={getScoreBadgeVariant(score)}>
                {score >= 80 ? '优秀' : score >= 60 ? '良好' : '需要提高'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">答对题目</span>
                <span className="font-semibold text-green-600">{correctAnswers} 题</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">答错题目</span>
                <span className="font-semibold text-red-600">{totalQuestions - correctAnswers} 题</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">平均用时</span>
                <span className="font-semibold">{Math.round((timeSpent || 0) / totalQuestions)}秒/题</span>
              </div>
            </div>

            {wrongAnswers.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">错题提醒</h3>
                <p className="text-red-700 text-sm">
                  你答错了 {wrongAnswers.length} 道题，这些题目已自动加入错题本，建议重点复习。
                </p>
              </div>
            )}

            {score >= 80 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">表现优秀！</h3>
                <p className="text-green-700 text-sm">
                  你的正确率达到了 {score}%，说明对这个知识领域掌握得很好。继续保持！
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'category' })}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重新测试
          </Button>
          
          {wrongAnswers.length > 0 && (
            <Button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'wrong-answers' })}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              查看错题本
            </Button>
          )}
          
          <Button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
            size="lg"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
};