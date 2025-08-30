import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BookOpen,
  Zap,
  Calendar,
  Award
} from 'lucide-react';
import { TestResult } from '@/types';
import { storage } from '@/utils/storage';

interface InsightData {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface LearningInsightsProps {
  onNavigate: (page: string) => void;
}

export const LearningInsights: React.FC<LearningInsightsProps> = ({ onNavigate }) => {
  const generateInsights = (): InsightData[] => {
    const testResults = storage.getTestResults();
    const wrongAnswers = storage.getWrongAnswers();
    const insights: InsightData[] = [];

    if (testResults.length === 0) {
      insights.push({
        type: 'info',
        icon: Brain,
        title: '开始你的学习之旅',
        description: '完成第一次测试，解锁个性化学习分析和建议功能。',
        action: {
          label: '开始测试',
          onClick: () => onNavigate('category')
        }
      });
      return insights;
    }

    // Recent performance analysis
    const recentTests = testResults.slice(-5);
    const recentAvg = recentTests.reduce((sum, test) => sum + test.score, 0) / recentTests.length;
    const overallAvg = testResults.reduce((sum, test) => sum + test.score, 0) / testResults.length;

    if (recentAvg > overallAvg + 10) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: '学习进步明显',
        description: `最近的测试表现优秀！平均得分比总体平均分高出 ${Math.round(recentAvg - overallAvg)}%。`,
      });
    } else if (recentAvg < overallAvg - 10) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: '需要调整学习策略',
        description: `最近的表现有所下滑，建议复习基础知识或调整学习方法。`,
        action: {
          label: '查看错题',
          onClick: () => onNavigate('wrong-answers')
        }
      });
    }

    // Category analysis
    const categoryStats: Record<string, { tests: TestResult[], avgScore: number }> = {};
    testResults.forEach(test => {
      if (!categoryStats[test.category]) {
        categoryStats[test.category] = { tests: [], avgScore: 0 };
      }
      categoryStats[test.category].tests.push(test);
    });

    Object.entries(categoryStats).forEach(([category, data]) => {
      data.avgScore = data.tests.reduce((sum, test) => sum + test.score, 0) / data.tests.length;
    });

    const weakestCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => a.avgScore - b.avgScore)[0];
    
    const strongestCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.avgScore - a.avgScore)[0];

    if (weakestCategory && weakestCategory[1].avgScore < 70) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${weakestCategory[0]} 需要重点关注`,
        description: `在 ${weakestCategory[0]} 领域的平均得分为 ${Math.round(weakestCategory[1].avgScore)}%，建议加强练习。`,
        action: {
          label: '专项练习',
          onClick: () => onNavigate('category')
        }
      });
    }

    if (strongestCategory && strongestCategory[1].avgScore > 85) {
      insights.push({
        type: 'success',
        icon: Award,
        title: `${strongestCategory[0]} 表现优秀`,
        description: `你在 ${strongestCategory[0]} 领域表现出色，平均得分 ${Math.round(strongestCategory[1].avgScore)}%！`,
      });
    }

    // Time analysis
    const testsWithTime = testResults.filter(test => test.timeSpent);
    if (testsWithTime.length > 0) {
      const avgTimePerQuestion = testsWithTime.reduce((sum, test) => {
        return sum + (test.timeSpent! / test.totalQuestions);
      }, 0) / testsWithTime.length;

      if (avgTimePerQuestion > 90) {
        insights.push({
          type: 'tip',
          icon: Clock,
          title: '提高答题速度',
          description: `平均每题用时 ${Math.round(avgTimePerQuestion)} 秒，可以通过更多练习来提高答题速度。`,
        });
      } else if (avgTimePerQuestion < 30) {
        insights.push({
          type: 'tip',
          icon: Target,
          title: '注意答题准确性',
          description: `答题速度很快，但要确保准确性。建议仔细阅读题目和选项。`,
        });
      }
    }

    // Wrong answers analysis
    if (wrongAnswers.length > 0) {
      const categoryWrongCounts: Record<string, number> = {};
      wrongAnswers.forEach(wa => {
        categoryWrongCounts[wa.question.category] = (categoryWrongCounts[wa.question.category] || 0) + 1;
      });

      const mostWrongCategory = Object.entries(categoryWrongCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostWrongCategory && mostWrongCategory[1] > 3) {
        insights.push({
          type: 'info',
          icon: BookOpen,
          title: '错题集中分析',
          description: `${mostWrongCategory[0]} 领域的错题较多（${mostWrongCategory[1]} 题），建议重点复习。`,
          action: {
            label: '复习错题',
            onClick: () => onNavigate('wrong-answers')
          }
        });
      }
    }

    // Streak analysis
    const today = new Date();
    const lastTest = testResults[testResults.length - 1];
    if (lastTest) {
      const daysSinceLastTest = Math.floor(
        (today.getTime() - new Date(lastTest.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastTest > 3) {
        insights.push({
          type: 'tip',
          icon: Calendar,
          title: '保持学习节奏',
          description: `距离上次测试已经 ${daysSinceLastTest} 天了，建议保持规律的学习习惯。`,
          action: {
            label: '开始练习',
            onClick: () => onNavigate('category')
          }
        });
      }
    }

    // Study frequency analysis
    if (testResults.length >= 10) {
      const last30Days = testResults.filter(test => {
        const testDate = new Date(test.completedAt);
        const daysDiff = (today.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      });

      if (last30Days.length < 5) {
        insights.push({
          type: 'tip',
          icon: Zap,
          title: '增加练习频率',
          description: '建议每周至少完成 2-3 次测试，保持学习的连续性和效果。',
        });
      }
    }

    // AI generation suggestion
    const categories = [...new Set(testResults.map(test => test.category))];
    if (categories.length >= 2 && testResults.length >= 20) {
      insights.push({
        type: 'tip',
        icon: Lightbulb,
        title: '扩展学习领域',
        description: '你已经在多个领域有了不错的基础，可以尝试生成新的题目类型来挑战自己。',
        action: {
          label: 'AI 出题',
          onClick: () => onNavigate('generate')
        }
      });
    }

    return insights.slice(0, 6); // Limit to 6 insights
  };

  const insights = generateInsights();

  const getInsightStyle = (type: InsightData['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950';
      case 'tip':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950';
      default:
        return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getIconColor = (type: InsightData['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'tip':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>智能学习洞察</span>
        </CardTitle>
        <CardDescription>
          基于你的学习数据生成的个性化建议和洞察
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getInsightStyle(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-foreground mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={insight.action.onClick}
                        className="text-xs"
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {insights.length === 0 && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-muted-foreground">
                暂无学习洞察，完成更多测试后将显示个性化建议
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};