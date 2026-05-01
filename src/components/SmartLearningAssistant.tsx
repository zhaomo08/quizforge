import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  Star,
  BookOpen,
  Lightbulb,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Zap,
  Trophy,
  Flame,
  Plus
} from 'lucide-react';
import { LearningAnalytics, LearningPattern, StudyRecommendation, LearningGoal } from '@/utils/learningAnalytics';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface MotivationalMessage {
  type: 'encouragement' | 'challenge' | 'celebration' | 'guidance';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const SmartLearningAssistant: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [learningPattern, setLearningPattern] = useState<LearningPattern | null>(null);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState<MotivationalMessage | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    setIsLoading(true);
    
    try {
      // 加载学习分析数据
      const pattern = LearningAnalytics.analyzeLearningPattern();
      const recs = LearningAnalytics.generateStudyRecommendations();
      const goals = LearningAnalytics.getLearningGoals();
      
      setLearningPattern(pattern);
      setRecommendations(recs);
      setLearningGoals(goals);
      
      // 计算学习连续天数和周进度
      calculateStudyMetrics();
      
      // 生成激励消息
      generateMotivationalMessage(pattern, goals);
      
    } catch (error) {
      console.error('加载学习数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStudyMetrics = () => {
    // 模拟计算学习连续天数
    const streak = Math.floor(Math.random() * 15) + 1;
    setStudyStreak(streak);
    
    // 模拟计算周进度
    const progress = Math.floor(Math.random() * 100);
    setWeeklyProgress(progress);
  };

  const generateMotivationalMessage = (pattern: LearningPattern, goals: LearningGoal[]) => {
    const messages: MotivationalMessage[] = [];
    
    // 根据学习趋势生成消息
    if (pattern.improvementTrend === 'improving') {
      messages.push({
        type: 'celebration',
        title: '进步神速！',
        message: '你的学习成绩正在稳步提升，继续保持这个势头！',
        icon: <TrendingUp className="h-5 w-5 text-green-500" />
      });
    } else if (pattern.improvementTrend === 'declining') {
      messages.push({
        type: 'encouragement',
        title: '不要气馁',
        message: '每个人都会遇到学习瓶颈，调整心态，重新出发！',
        icon: <Lightbulb className="h-5 w-5 text-blue-500" />
      });
    }

    // 根据强项生成消息
    if (pattern.strongAreas.length > 0) {
      messages.push({
        type: 'challenge',
        title: '挑战更高难度',
        message: `你在${getCategoryName(pattern.strongAreas[0] ?? '')}方面表现优秀，可以尝试更有挑战性的内容！`,
        icon: <Trophy className="h-5 w-5 text-yellow-500" />
      });
    }

    // 根据目标完成情况生成消息
    const completedGoals = goals.filter(g => g.isCompleted);
    if (completedGoals.length > 0) {
      messages.push({
        type: 'celebration',
        title: '目标达成！',
        message: `恭喜你完成了${completedGoals.length}个学习目标，真是太棒了！`,
        icon: <Award className="h-5 w-5 text-purple-500" />
      });
    }

    // 默认鼓励消息
    if (messages.length === 0) {
      messages.push({
        type: 'guidance',
        title: '开始你的学习之旅',
        message: '制定明确的学习目标，坚持每日练习，你一定能取得进步！',
        icon: <Star className="h-5 w-5 text-blue-500" />
      });
    }

    setMotivationalMessage(messages[Math.floor(Math.random() * messages.length)] ?? null);
  };

  const getCategoryName = (categoryId: string): string => {
    const categoryMap: Record<string, string> = {
      'java': 'Java',
      'python': 'Python',
      'javascript': 'JavaScript',
      'database': '数据库',
      'algorithm': '算法与数据结构',
      'system-design': '系统设计',
      'operating-system': '操作系统',
    };
    return categoryMap[categoryId] || categoryId;
  };

  const handleRecommendationAction = (recommendation: StudyRecommendation) => {
    if (recommendation.category) {
      // 跳转到对应类别的测试
      dispatch({ type: 'SET_CATEGORY', payload: recommendation.category });
      navigate('/test-setup');
    } else if (recommendation.type === 'rest') {
      // 显示休息建议
      dispatch({ 
        type: 'SET_ERROR', 
        payload: '建议你适当休息，保持良好的学习状态更重要！' 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'practice': return <Target className="h-4 w-4" />;
      case 'review': return <BookOpen className="h-4 w-4" />;
      case 'learn': return <Brain className="h-4 w-4" />;
      case 'rest': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 激励消息卡片 */}
      {motivationalMessage && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {motivationalMessage.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {motivationalMessage.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {motivationalMessage.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 学习概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {studyStreak}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">连续学习天数</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-blue-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyProgress}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">本周进度</p>
            <Progress value={weeklyProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {learningPattern?.studyTime || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">建议学习时间(分钟)</p>
          </CardContent>
        </Card>
      </div>

      {/* 学习模式分析 */}
      {learningPattern && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              学习模式分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 强项展示 */}
            {learningPattern.strongAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  你的强项
                </h4>
                <div className="flex flex-wrap gap-2">
                  {learningPattern.strongAreas.map(area => (
                    <Badge key={area} variant="default" className="bg-green-100 text-green-800">
                      {getCategoryName(area)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 待提升领域 */}
            {learningPattern.weakAreas.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  待提升领域
                </h4>
                <div className="flex flex-wrap gap-2">
                  {learningPattern.weakAreas.map(area => (
                    <Badge key={area} variant="outline" className="border-yellow-300 text-yellow-700">
                      {getCategoryName(area)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 学习趋势 */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                学习趋势
              </h4>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={
                    learningPattern.improvementTrend === 'improving' ? 'border-green-300 text-green-700' :
                    learningPattern.improvementTrend === 'declining' ? 'border-red-300 text-red-700' :
                    'border-gray-300 text-gray-700'
                  }
                >
                  {learningPattern.improvementTrend === 'improving' ? '📈 持续进步' :
                   learningPattern.improvementTrend === 'declining' ? '📉 需要调整' :
                   '📊 保持稳定'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 智能推荐 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            智能学习建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getRecommendationIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </h4>
                          <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                            {rec.priority === 'high' ? '高优先级' : 
                             rec.priority === 'medium' ? '中优先级' : '低优先级'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          预计用时: {rec.estimatedTime}分钟
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRecommendationAction(rec)}
                      className="ml-4"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      开始
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">完成更多测试后，我将为你提供个性化的学习建议</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 学习目标 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            学习目标
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningGoals.length > 0 ? (
            <div className="space-y-4">
              {learningGoals.map((goal, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {goal.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {goal.description}
                      </p>
                    </div>
                    {goal.isCompleted && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已完成
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        当前准确率: {goal.currentAccuracy}%
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        目标: {goal.targetAccuracy}%
                      </span>
                    </div>
                    <Progress 
                      value={goal.progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>进度: {Math.round(goal.progress)}%</span>
                      <span>
                        截止: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">还没有设置学习目标</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                设置目标
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速行动 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            快速行动
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                navigate('/category');
              }}
            >
              <Target className="h-6 w-6 text-blue-500" />
              <span className="font-medium">开始练习</span>
              <span className="text-xs text-gray-500">选择类别开始测试</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                navigate('/wrong-answers');
              }}
            >
              <BookOpen className="h-6 w-6 text-orange-500" />
              <span className="font-medium">复习错题</span>
              <span className="text-xs text-gray-500">巩固薄弱知识点</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                navigate('/analytics');
              }}
            >
              <BarChart3 className="h-6 w-6 text-green-500" />
              <span className="font-medium">学习分析</span>
              <span className="text-xs text-gray-500">查看详细统计</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                navigate('/generate');
              }}
            >
              <Brain className="h-6 w-6 text-purple-500" />
              <span className="font-medium">AI生成题目</span>
              <span className="text-xs text-gray-500">创建新的练习内容</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};