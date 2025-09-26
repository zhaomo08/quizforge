import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, BookOpen, BarChart3, Zap, Award, TrendingUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { testUtils } from '@/utils/testUtils';
import { LearningInsights } from '@/components/LearningInsights';
import { notificationSystem } from '@/utils/notificationSystem';

export const HomePage: React.FC = () => {
  const { dispatch } = useApp();

  const stats = testUtils.getUserStats();

  // Initialize notifications on component mount
  React.useEffect(() => {
    notificationSystem.checkForNotifications();
  }, []);

  // 检查URL参数中的登录状态
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');
    
    if (loginStatus === 'success' || error) {
      if (error) console.error('OAuth error:', error);
      // 仅移除 login/error 参数，保留其它参数（尤其是 ?p= 用于路由）
      const sp = new URLSearchParams(window.location.search);
      sp.delete('login');
      sp.delete('error');
      const newUrl = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI智能出题',
      description: '基于GPT技术，自动生成高质量的面试题目，覆盖多个技术领域',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Target,
      title: '精准测评',
      description: '即时反馈答题结果，详细解析帮助你理解知识点',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: BookOpen,
      title: '智能错题本',
      description: '自动收集错题，支持重复练习，巩固薄弱环节',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '详细的学习报告和进度跟踪，让学习更有方向',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const quickActions = [
    {
      title: '开始答题',
      description: '选择类别，开始你的面试练习',
      icon: Zap,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => dispatch({ type: 'SET_PAGE', payload: 'category' }),
    },
    {
      title: '智能学习助手',
      description: '获得个性化学习建议和分析',
      icon: Brain,
      color: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      action: () => dispatch({ type: 'SET_PAGE', payload: 'learning-assistant' }),
    },
    {
      title: '学习分析',
      description: '查看详细的学习数据和进度',
      icon: BarChart3,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => dispatch({ type: 'SET_PAGE', payload: 'analytics' }),
    },
    {
      title: 'AI出题',
      description: '使用AI生成新的面试题目',
      icon: Target,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => dispatch({ type: 'SET_PAGE', payload: 'generate' }),
    },
    {
      title: '错题本',
      description: '复习你做错的题目',
      icon: BookOpen,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => dispatch({ type: 'SET_PAGE', payload: 'wrong-answers' }),
    },
  ];

  return (
    <div className="page-container layout-stable">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full shadow-lg animate-pulse">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-300 bg-clip-text text-transparent">
          AI驱动的面试题自测平台
        </h1>
        <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          利用先进的AI技术，为你生成个性化的面试题目，帮助你在技术面试中脱颖而出
        </p>
      </div>

      {/* Stats Cards */}
      {stats.totalTests > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-slide-up">
          <Card>
            <CardContent className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                  <p className="text-gray-600">测试次数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  <p className="text-gray-600">平均得分</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWrongAnswers}</p>
                  <p className="text-gray-600">错题数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%
                  </p>
                  <p className="text-gray-600">正确率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 animate-slide-up" style={{animationDelay: '0.2s'}}>
        {quickActions.map(({ title, description, icon: Icon, color, action }) => (
          <Card key={title} className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className={`inline-flex p-3 rounded-full ${color} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{description}</p>
                <Button onClick={action} className="w-full transition-all duration-200 hover:shadow-md">
                  开始使用
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Learning Insights */}
      {stats.totalTests > 0 && (
        <div className="mb-12 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <LearningInsights onNavigate={(page) => dispatch({ type: 'SET_PAGE', payload: page })} />
        </div>
      )}

      {/* Quick Analytics Preview */}
      {stats.totalTests > 5 && (
        <Card className="mb-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>学习趋势</span>
                </CardTitle>
                <CardDescription>
                  最近的学习表现和进步情况
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => dispatch({ type: 'SET_PAGE', payload: 'analytics' })}
              >
                查看详细分析
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Object.keys(stats.categoryStats).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  学习领域
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  总体正确率
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.totalWrongAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  待复习错题
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 功能介绍（竖版） */}
      <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description, color, bgColor }) => (
            <Card
              key={title}
              className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-200/70 dark:border-gray-800/70"
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className="mb-4">
                    <div className={`inline-flex p-3 rounded-xl ${bgColor}`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                  </div>
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">{title}</h3>
                  {/* Description */}
                  <p className="text-gray-600 dark:text-muted-foreground leading-relaxed flex-1">
                    {description}
                  </p>
                  {/* CTA */}
                  <div className="mt-4">
                    <Button variant="ghost" size="sm" className="px-0 text-blue-600 dark:text-blue-400 hover:underline">
                      了解更多
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};