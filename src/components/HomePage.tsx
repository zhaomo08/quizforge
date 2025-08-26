import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, BookOpen, BarChart3, Zap, Award, Clock, TrendingUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { testUtils } from '@/utils/testUtils';

export const HomePage: React.FC = () => {
  const { dispatch } = useApp();

  const stats = testUtils.getUserStats();

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
      title: 'AI出题',
      description: '使用AI生成新的面试题目',
      icon: Brain,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI驱动的面试题自测平台
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          利用先进的AI技术，为你生成个性化的面试题目，帮助你在技术面试中脱颖而出
        </p>
      </div>

      {/* Stats Cards */}
      {stats.totalTests > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                  <p className="text-gray-600">测试次数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  <p className="text-gray-600">平均得分</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWrongAnswers}</p>
                  <p className="text-gray-600">错题数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {quickActions.map(({ title, description, icon: Icon, color, action }) => (
          <Card key={title} className="cursor-pointer transition-transform hover:scale-105">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className={`inline-flex p-3 rounded-full ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-4">{description}</p>
                <Button onClick={action} className="w-full">
                  开始使用
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map(({ icon: Icon, title, description, color, bgColor }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};