import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Star,
  Lightbulb,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { GenerationAnalytics, SmartRecommendation, GenerationInsight } from '@/utils/generationAnalytics';

interface SmartGenerationAssistantProps {
  onApplyRecommendation: (type: string, value: string | number) => void;
  currentSettings: {
    category: string;
    difficulty: string;
    count: string;
  };
}

export const SmartGenerationAssistant: React.FC<SmartGenerationAssistantProps> = ({
  onApplyRecommendation,
  currentSettings
}) => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [insights, setInsights] = useState<GenerationInsight[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recs, categoryInsights, generationStats] = await Promise.all([
        Promise.resolve(GenerationAnalytics.generateSmartRecommendations()),
        Promise.resolve(GenerationAnalytics.getCategoryInsights()),
        Promise.resolve(GenerationAnalytics.getGenerationStats())
      ]);

      setRecommendations(recs);
      setInsights(categoryInsights);
      setStats(generationStats);
    } catch (error) {
      console.error('加载智能助手数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'category': return <Target className="h-4 w-4" />;
      case 'difficulty': return <TrendingUp className="h-4 w-4" />;
      case 'count': return <BarChart3 className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
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

  const formatDifficulty = (difficulty: string): string => {
    const difficultyMap: Record<string, string> = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>正在分析你的学习数据...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 智能推荐 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            智能推荐
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                暂无个性化推荐，开始生成题目后将为你提供智能建议
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getRecommendationIcon(rec.type)}
                        <h4 className="font-medium text-gray-900 dark:text-foreground">
                          {rec.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={getConfidenceColor(rec.confidence)}
                        >
                          {Math.round(rec.confidence * 100)}% 置信度
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>推荐理由: {rec.reason}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplyRecommendation(rec.type, rec.value)}
                      className="ml-4"
                    >
                      应用
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成统计 */}
      {stats && stats.totalGenerations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              生成统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalGenerations}</div>
                <div className="text-sm text-gray-600 dark:text-muted-foreground">总生成次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-600 dark:text-muted-foreground">生成题目数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(stats.averageQuality)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-muted-foreground">平均质量</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.successRate * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-muted-foreground">成功率</div>
              </div>
            </div>
            
            {stats.mostUsedModel && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-muted-foreground">最常用模型:</span>
                  <Badge variant="secondary">{stats.mostUsedModel}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-muted-foreground">平均生成时间:</span>
                  <span className="font-medium">
                    {(stats.averageGenerationTime / 1000).toFixed(1)}秒
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 类别洞察 */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              类别分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-foreground">
                        {getCategoryName(insight.category)}
                      </h4>
                      <Badge variant="outline">
                        {insight.totalGenerated} 题
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-muted-foreground">
                      <span>质量: {Math.round(insight.averageQuality)}%</span>
                      <span>偏好: {formatDifficulty(insight.preferredDifficulty)}</span>
                      <span>推荐: {insight.recommendedCount}题/次</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {insight.duplicateRate > 0.1 && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" title="重复率较高" />
                    )}
                    {insight.averageQuality > 80 && (
                      <CheckCircle className="h-4 w-4 text-green-500" title="质量优秀" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 刷新按钮 */}
      <div className="text-center">
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新分析
        </Button>
      </div>
    </div>
  );
};