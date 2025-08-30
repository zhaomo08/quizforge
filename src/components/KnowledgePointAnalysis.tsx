import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  XCircle,
  Lightbulb,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { storage } from '@/utils/storage';
import { KnowledgePointAnalyzer, KnowledgePointStats, type KnowledgePointAnalysis as KnowledgePointAnalysisType } from '@/utils/knowledgePointAnalyzer';

interface KnowledgePointAnalysisProps {
  category?: string;
  showDetailedView?: boolean;
}

export const KnowledgePointAnalysis: React.FC<KnowledgePointAnalysisProps> = ({ 
  category, 
  showDetailedView = true 
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview');
  const [showWeakOnly, setShowWeakOnly] = useState(false);
  const [expandedPoint, setExpandedPoint] = useState<string | null>(null);

  const analysis = useMemo((): KnowledgePointAnalysisType => {
    const testResults = storage.getTestResults();
    const filteredResults = category 
      ? testResults.filter(r => r.category === category)
      : testResults;
    
    return KnowledgePointAnalyzer.generateKnowledgePointAnalysis(filteredResults);
  }, [category]);

  const filteredPoints = useMemo(() => {
    const allPoints = [
      ...analysis.strongPoints,
      ...analysis.weakPoints,
      ...analysis.improvingPoints,
      ...analysis.decliningPoints
    ];
    
    // 去重并按尝试次数排序
    const uniquePoints = allPoints.reduce((acc, point) => {
      if (!acc.find(p => p.id === point.id)) {
        acc.push(point);
      }
      return acc;
    }, [] as KnowledgePointStats[]);
    
    const sorted = uniquePoints.sort((a, b) => b.totalAttempts - a.totalAttempts);
    
    return showWeakOnly ? sorted.filter(p => p.accuracy < 70) : sorted;
  }, [analysis, showWeakOnly]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (accuracy >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (accuracy >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    const labels = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };
    return (
      <Badge className={colors[difficulty as keyof typeof colors]}>
        {labels[difficulty as keyof typeof labels]}
      </Badge>
    );
  };

  if (filteredPoints.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            暂无知识点数据
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            完成更多测试后，这里将显示详细的知识点掌握分析
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>知识点掌握度分析</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWeakOnly(!showWeakOnly)}
              >
                {showWeakOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {showWeakOnly ? '显示全部' : '仅显示薄弱项'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysis.overallMastery}%</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">整体掌握度</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.strongPoints.length}</div>
              <div className="text-sm text-green-700 dark:text-green-300">优势知识点</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.weakPoints.length}</div>
              <div className="text-sm text-red-700 dark:text-red-300">薄弱知识点</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analysis.improvingPoints.length}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">进步中</div>
            </div>
          </div>

          {/* 整体掌握度进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">整体掌握度</span>
              <span className="text-sm text-gray-600">{analysis.overallMastery}%</span>
            </div>
            <Progress value={analysis.overallMastery} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {showDetailedView && (
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">知识点概览</TabsTrigger>
            <TabsTrigger value="detailed">详细分析</TabsTrigger>
            <TabsTrigger value="recommendations">学习建议</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>知识点表现概览</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPoints.slice(0, 10).map((point) => (
                    <div key={point.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {point.name}
                          </h4>
                          {getTrendIcon(point.trend)}
                          {getDifficultyBadge(point.difficulty)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{point.correctAttempts}/{point.totalAttempts} 正确</span>
                          <span>平均 {point.averageTime}s</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getAccuracyColor(point.accuracy)}>
                          {point.accuracy}%
                        </Badge>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              point.accuracy >= 80 ? 'bg-green-500' :
                              point.accuracy >= 70 ? 'bg-blue-500' :
                              point.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${point.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredPoints.map((point) => (
                <Card key={point.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div 
                      className="flex items-center justify-between"
                      onClick={() => setExpandedPoint(expandedPoint === point.id ? null : point.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {point.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {point.category}
                            </span>
                            {getTrendIcon(point.trend)}
                            {getDifficultyBadge(point.difficulty)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold">{point.accuracy}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {point.correctAttempts}/{point.totalAttempts}
                          </div>
                        </div>
                        <Progress value={point.accuracy} className="w-20 h-2" />
                      </div>
                    </div>

                    {expandedPoint === point.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-lg font-semibold text-blue-600">{point.totalAttempts}</div>
                            <div className="text-xs text-blue-700 dark:text-blue-300">总尝试</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="text-lg font-semibold text-green-600">{point.correctAttempts}</div>
                            <div className="text-xs text-green-700 dark:text-green-300">正确次数</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                            <div className="text-lg font-semibold text-purple-600">{point.averageTime}s</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">平均用时</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-lg font-semibold text-gray-600">
                              {point.trend === 'improving' ? '↗️' : point.trend === 'declining' ? '↘️' : '➡️'}
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-300">趋势</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">针对性建议:</h5>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {KnowledgePointAnalyzer.getKnowledgePointRecommendations(point).map((rec, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>个性化学习建议</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                        <p className="text-blue-800 dark:text-blue-200">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分类建议 */}
                <div className="mt-6 space-y-4">
                  {analysis.weakPoints.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        需要重点关注的知识点
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.weakPoints.slice(0, 5).map((point) => (
                          <Badge key={point.id} variant="destructive">
                            {point.name} ({point.accuracy}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.improvingPoints.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        进步中的知识点
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.improvingPoints.slice(0, 5).map((point) => (
                          <Badge key={point.id} className="bg-green-100 text-green-800">
                            {point.name} ({point.accuracy}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.strongPoints.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        掌握良好的知识点
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.strongPoints.slice(0, 5).map((point) => (
                          <Badge key={point.id} className="bg-blue-100 text-blue-800">
                            {point.name} ({point.accuracy}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};