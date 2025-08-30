import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BookOpen, 
  Brain,
  Calendar,
  Zap,
  Trophy,
  Activity,
  PieChart,
  LineChart,
  Users,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  FileText
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { storage } from '@/utils/storage';
import { LearningGoals } from '@/components/LearningGoals';
import { reportGenerator } from '@/utils/reportGenerator';
import { testUtils } from '@/utils/testUtils';
import { TestResult } from '@/types';

interface AnalyticsData {
  testResults: TestResult[];
  stats: ReturnType<typeof testUtils.getUserStats>;
  recentActivity: TestResult[];
  categoryPerformance: Array<{
    category: string;
    tests: number;
    avgScore: number;
    trend: 'up' | 'down' | 'stable';
    improvement: number;
  }>;
  timeAnalysis: {
    totalTimeSpent: number;
    avgTimePerTest: number;
    avgTimePerQuestion: number;
  };
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastTestDate: string;
  };
}

export const AnalyticsPage: React.FC = () => {
  const { dispatch } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const analyticsData = useMemo((): AnalyticsData => {
    const testResults = storage.getTestResults();
    const stats = testUtils.getUserStats();
    
    // Filter by period
    const now = new Date();
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 0;
    const filteredResults = periodDays > 0 
      ? testResults.filter(result => {
          const resultDate = new Date(result.completedAt);
          const daysDiff = (now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= periodDays;
        })
      : testResults;

    // Recent activity (last 10 tests)
    const recentActivity = testResults
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);

    // Category performance with trends
    const categoryPerformance = Object.entries(stats.categoryStats).map(([category, categoryStats]) => {
      const categoryResults = testResults.filter(r => r.category === category);
      const recentResults = categoryResults.slice(-5);
      const olderResults = categoryResults.slice(-10, -5);
      
      const recentAvg = recentResults.length > 0 
        ? recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length 
        : 0;
      const olderAvg = olderResults.length > 0 
        ? olderResults.reduce((sum, r) => sum + r.score, 0) / olderResults.length 
        : recentAvg;
      
      const improvement = recentAvg - olderAvg;
      const trend = improvement > 5 ? 'up' : improvement < -5 ? 'down' : 'stable';

      return {
        category,
        tests: categoryStats.totalTests,
        avgScore: Math.round(categoryStats.averageScore),
        trend,
        improvement: Math.round(improvement)
      };
    });

    // Time analysis
    const totalTimeSpent = testResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0);
    const avgTimePerTest = testResults.length > 0 ? totalTimeSpent / testResults.length : 0;
    const totalQuestions = testResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const avgTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    // Streak calculation
    const sortedResults = testResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (sortedResults.length > 0) {
      const today = new Date();
      const lastTestDate = new Date(sortedResults[0].completedAt);
      const daysSinceLastTest = Math.floor((today.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastTest <= 1) {
        currentStreak = 1;
        let currentDate = new Date(lastTestDate);
        
        for (let i = 1; i < sortedResults.length; i++) {
          const testDate = new Date(sortedResults[i].completedAt);
          const daysDiff = Math.floor((currentDate.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) {
            currentStreak++;
            currentDate = testDate;
          } else {
            break;
          }
        }
      }
      
      // Calculate longest streak
      tempStreak = 1;
      let prevDate = new Date(sortedResults[0].completedAt);
      
      for (let i = 1; i < sortedResults.length; i++) {
        const testDate = new Date(sortedResults[i].completedAt);
        const daysDiff = Math.floor((prevDate.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
        prevDate = testDate;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      testResults: filteredResults,
      stats,
      recentActivity,
      categoryPerformance,
      timeAnalysis: {
        totalTimeSpent,
        avgTimePerTest,
        avgTimePerQuestion
      },
      streakData: {
        currentStreak,
        longestStreak,
        lastTestDate: sortedResults.length > 0 ? sortedResults[0].completedAt : ''
      }
    };
  }, [selectedPeriod]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: '优秀', color: 'bg-green-500' };
    if (score >= 80) return { level: '良好', color: 'bg-blue-500' };
    if (score >= 70) return { level: '一般', color: 'bg-yellow-500' };
    if (score >= 60) return { level: '待提高', color: 'bg-orange-500' };
    return { level: '需加强', color: 'bg-red-500' };
  };

  return (
    <div className="page-container layout-stable">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
            学习分析仪表板
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            深入了解你的学习进度和表现趋势
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'all' ? '全部' : period}
            </Button>
          ))}
          
          {analyticsData.stats.totalTests > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 0;
                const report = reportGenerator.generateReport(periodDays || 365);
                reportGenerator.downloadReport(report, 'txt');
              }}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>导出报告</span>
            </Button>
          )}
        </div>
      </div>

      {analyticsData.stats.totalTests === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
              还没有测试数据
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6">
              开始你的第一次测试，解锁详细的学习分析功能
            </p>
            <Button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'category' })}>
              开始测试
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="performance">表现分析</TabsTrigger>
            <TabsTrigger value="progress">进度跟踪</TabsTrigger>
            <TabsTrigger value="insights">学习洞察</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                        总测试次数
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        {analyticsData.stats.totalTests}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-full">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                        平均得分
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        {analyticsData.stats.averageScore}%
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-full">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                        学习连击
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        {analyticsData.streakData.currentStreak}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-full">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                        总学习时长
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        {Math.round(analyticsData.timeAnalysis.totalTimeSpent / 60)}m
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-full">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>分类表现</span>
                </CardTitle>
                <CardDescription>
                  各个知识领域的学习表现和趋势
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categoryPerformance.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-foreground">
                            {category.category}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-muted-foreground">
                            {category.tests} 次测试
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge className={getScoreColor(category.avgScore)}>
                              {category.avgScore}%
                            </Badge>
                            {getTrendIcon(category.trend)}
                          </div>
                          {category.improvement !== 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {category.improvement > 0 ? '+' : ''}{category.improvement}%
                            </p>
                          )}
                        </div>
                        
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getPerformanceLevel(category.avgScore).color}`}
                            style={{ width: `${category.avgScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>最近活动</span>
                </CardTitle>
                <CardDescription>
                  最近的测试记录和表现
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recentActivity.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${result.score >= 80 ? 'bg-green-50 dark:bg-green-950' : result.score >= 60 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-red-50 dark:bg-red-950'}`}>
                          {result.score >= 80 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : result.score >= 60 ? (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-foreground">
                            {result.category}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-muted-foreground">
                            {new Date(result.completedAt).toLocaleDateString('zh-CN')} • 
                            {result.correctAnswers}/{result.totalQuestions} 题正确
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={getScoreColor(result.score)}>
                        {result.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>得分分布</CardTitle>
                  <CardDescription>
                    你的测试得分分布情况
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { range: '90-100%', label: '优秀', color: 'bg-green-500', count: analyticsData.testResults.filter(r => r.score >= 90).length },
                      { range: '80-89%', label: '良好', color: 'bg-blue-500', count: analyticsData.testResults.filter(r => r.score >= 80 && r.score < 90).length },
                      { range: '70-79%', label: '一般', color: 'bg-yellow-500', count: analyticsData.testResults.filter(r => r.score >= 70 && r.score < 80).length },
                      { range: '60-69%', label: '待提高', color: 'bg-orange-500', count: analyticsData.testResults.filter(r => r.score >= 60 && r.score < 70).length },
                      { range: '0-59%', label: '需加强', color: 'bg-red-500', count: analyticsData.testResults.filter(r => r.score < 60).length },
                    ].map((item) => (
                      <div key={item.range} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${item.color}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-sm text-gray-500">({item.range})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{item.count}</span>
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ 
                                width: `${analyticsData.testResults.length > 0 ? (item.count / analyticsData.testResults.length) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>时间效率</CardTitle>
                  <CardDescription>
                    你的答题时间分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
                        {Math.round(analyticsData.timeAnalysis.avgTimePerQuestion)}s
                      </div>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        平均每题用时
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-bold text-gray-900 dark:text-foreground">
                          {Math.round(analyticsData.timeAnalysis.avgTimePerTest / 60)}m
                        </div>
                        <p className="text-xs text-gray-600 dark:text-muted-foreground">
                          平均测试时长
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-bold text-gray-900 dark:text-foreground">
                          {Math.round(analyticsData.timeAnalysis.totalTimeSpent / 3600)}h
                        </div>
                        <p className="text-xs text-gray-600 dark:text-muted-foreground">
                          总学习时长
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Learning Goals */}
            <LearningGoals />
            
            {/* Learning Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>学习连击</span>
                </CardTitle>
                <CardDescription>
                  保持连续学习的记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {analyticsData.streakData.currentStreak}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      当前连击
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {analyticsData.streakData.longestStreak}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      最长连击
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-foreground mb-2">
                      {analyticsData.streakData.lastTestDate ? 
                        new Date(analyticsData.streakData.lastTestDate).toLocaleDateString('zh-CN') : 
                        '暂无'
                      }
                    </div>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      最后测试
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Goals */}
            <Card>
              <CardHeader>
                <CardTitle>学习目标</CardTitle>
                <CardDescription>
                  设定和跟踪你的学习目标
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">每周测试目标</span>
                      <span className="text-sm text-gray-600">3/5 完成</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">平均分目标 (85%)</span>
                      <span className="text-sm text-gray-600">{analyticsData.stats.averageScore}% 当前</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((analyticsData.stats.averageScore / 85) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Learning Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>学习报告预览</span>
                </CardTitle>
                <CardDescription>
                  基于当前数据生成的详细学习分析报告
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 0;
                  const report = reportGenerator.generateReport(periodDays || 365);
                  
                  return (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-foreground mb-3">
                          总体表现
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {report.summary.totalTests}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">
                              测试次数
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {report.summary.averageScore}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">
                              平均得分
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className={`text-2xl font-bold ${report.summary.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {report.summary.improvementRate > 0 ? '+' : ''}{report.summary.improvementRate}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">
                              进步幅度
                            </div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.round(report.summary.totalTimeSpent / 60)}m
                            </div>
                            <div className="text-sm text-gray-600 dark:text-muted-foreground">
                              学习时长
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Achievements */}
                      {report.achievements.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-foreground mb-3">
                            获得成就
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {report.achievements.map((achievement, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                                <div>
                                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                                    {achievement.title}
                                  </div>
                                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                    {achievement.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Recommendations */}
                      {report.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-foreground mb-3">
                            重点建议
                          </h4>
                          <div className="space-y-3">
                            {report.recommendations.slice(0, 3).map((rec, index) => (
                              <div key={index} className={`p-3 rounded-lg border ${
                                rec.priority === 'high' 
                                  ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                                  : rec.priority === 'medium'
                                  ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                                  : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                              }`}>
                                <div className="flex items-start space-x-2">
                                  <Badge className={
                                    rec.priority === 'high' 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : rec.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  }>
                                    {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                                  </Badge>
                                </div>
                                <div className="mt-2">
                                  <div className="font-medium text-gray-900 dark:text-foreground">
                                    {rec.suggestion}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                    {rec.reason}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Export Options */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => reportGenerator.downloadReport(report, 'txt')}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>下载文本报告</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => reportGenerator.downloadReport(report, 'json')}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>下载JSON数据</span>
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            {/* Learning Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>学习洞察</span>
                </CardTitle>
                <CardDescription>
                  基于你的学习数据生成的个性化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Generate insights based on data */}
                  {analyticsData.stats.averageScore < 70 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                            需要加强基础知识
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            你的平均得分为 {analyticsData.stats.averageScore}%，建议重点复习基础概念，多做练习题。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.streakData.currentStreak === 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                            保持学习节奏
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            建议每天至少完成一次测试，保持学习的连续性和习惯。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.categoryPerformance.some(c => c.trend === 'up') && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800 dark:text-green-200">
                            进步明显
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            在 {analyticsData.categoryPerformance.filter(c => c.trend === 'up').map(c => c.category).join('、')} 
                            方面表现有明显提升，继续保持！
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-800 dark:text-purple-200">
                          个性化建议
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          根据你的学习模式，建议在 
                          {analyticsData.timeAnalysis.avgTimePerQuestion > 60 ? '提高答题速度' : '保持当前节奏'}，
                          重点关注错题复习。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle>推荐行动</CardTitle>
                <CardDescription>
                  基于分析结果的具体建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: 'wrong-answers' })}
                  >
                    <div className="text-left">
                      <div className="font-medium">复习错题</div>
                      <div className="text-sm text-gray-600 dark:text-muted-foreground">
                        巩固薄弱知识点
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: 'generate' })}
                  >
                    <div className="text-left">
                      <div className="font-medium">生成新题</div>
                      <div className="text-sm text-gray-600 dark:text-muted-foreground">
                        扩展练习范围
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: 'category' })}
                  >
                    <div className="text-left">
                      <div className="font-medium">专项练习</div>
                      <div className="text-sm text-gray-600 dark:text-muted-foreground">
                        针对性提升
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <div className="font-medium">设置目标</div>
                      <div className="text-sm text-gray-600 dark:text-muted-foreground">
                        制定学习计划
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};