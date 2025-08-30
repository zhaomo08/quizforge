import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Brain, 
  Target, 
  Zap,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';

export const OptimizationDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<'before' | 'after'>('before');

  const optimizations = [
    {
      title: '增强的答题体验',
      description: '添加了智能提示、笔记功能、收藏题目等辅助功能',
      improvements: [
        '渐进式提示系统',
        '题目笔记和收藏',
        '信心度评估',
        '暂停/继续功能',
        '更好的视觉反馈'
      ],
      icon: <Target className="h-6 w-6 text-blue-500" />
    },
    {
      title: '智能学习分析',
      description: '基于答题数据提供个性化的学习建议和分析',
      improvements: [
        '学习模式识别',
        '知识点掌握度分析',
        '个性化学习建议',
        '学习目标管理',
        '进步趋势跟踪'
      ],
      icon: <Brain className="h-6 w-6 text-purple-500" />
    },
    {
      title: '增强的结果展示',
      description: '多维度的能力分析和详细的学习报告',
      improvements: [
        '多维度能力分析',
        '知识点详细报告',
        '历史成绩对比',
        '学习洞察建议',
        '可视化进度展示'
      ],
      icon: <TrendingUp className="h-6 w-6 text-green-500" />
    },
    {
      title: '智能学习助手',
      description: 'AI驱动的个性化学习指导和建议系统',
      improvements: [
        '个性化学习路径',
        '智能推荐系统',
        '学习效率分析',
        '激励机制设计',
        '学习习惯培养'
      ],
      icon: <Sparkles className="h-6 w-6 text-yellow-500" />
    }
  ];

  const beforeFeatures = [
    '基础答题功能',
    '简单结果展示',
    '错题本功能',
    '基础统计信息'
  ];

  const afterFeatures = [
    '智能答题辅助系统',
    '多维度学习分析',
    '个性化学习建议',
    '智能学习助手',
    '增强的视觉体验',
    '学习目标管理',
    '进度追踪系统',
    '知识点掌握度分析'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          答题体验优化完成 🎉
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          核心功能体验全面提升，让学习更智能、更高效
        </p>
      </div>

      {/* 对比展示 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-4">
            <span>功能对比</span>
            <div className="flex space-x-2">
              <Button
                variant={currentDemo === 'before' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentDemo('before')}
              >
                优化前
              </Button>
              <Button
                variant={currentDemo === 'after' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentDemo('after')}
              >
                优化后
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`transition-all duration-500 ${currentDemo === 'before' ? 'opacity-100' : 'opacity-50'}`}>
              <h3 className="text-lg font-semibold mb-4 text-gray-600">优化前</h3>
              <div className="space-y-2">
                {beforeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={`transition-all duration-500 ${currentDemo === 'after' ? 'opacity-100' : 'opacity-50'}`}>
              <h3 className="text-lg font-semibold mb-4 text-green-600">优化后</h3>
              <div className="space-y-2">
                {afterFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-800 dark:text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 优化详情 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {optimizations.map((optimization, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {optimization.icon}
                <span>{optimization.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {optimization.description}
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">主要改进:</h4>
                {optimization.improvements.map((improvement, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{improvement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 核心亮点 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-yellow-500" />
            <span>核心亮点</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">智能化</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI驱动的个性化学习建议和智能分析
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">精准化</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                多维度分析，精准识别学习薄弱环节
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">高效化</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                优化学习路径，提升学习效率和体验
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <span>如何体验新功能</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800 mt-1">1</Badge>
              <div>
                <h4 className="font-medium">开始答题</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  选择类别开始测试，体验增强的答题界面和智能提示功能
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-green-100 text-green-800 mt-1">2</Badge>
              <div>
                <h4 className="font-medium">查看智能分析</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  完成测试后查看详细的能力分析和学习建议
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-purple-100 text-purple-800 mt-1">3</Badge>
              <div>
                <h4 className="font-medium">使用学习助手</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  访问智能学习助手获得个性化的学习指导和建议
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 行动按钮 */}
      <div className="text-center">
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <ArrowRight className="h-5 w-5 mr-2" />
          立即体验优化后的功能
        </Button>
      </div>
    </div>
  );
};