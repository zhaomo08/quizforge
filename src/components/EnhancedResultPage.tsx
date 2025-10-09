import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  RotateCcw, 
  Home,
  TrendingUp,
  Brain,
  BookOpen,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Lightbulb,
  Award,
  Zap,
  Eye,
  Download,
  FileText,
  FileJson
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { storage } from '@/utils/storage';
import { reportGenerator } from '@/utils/reportGenerator';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { KnowledgePointAnalyzer } from '@/utils/knowledgePointAnalyzer';

interface KnowledgePoint {
  name: string;
  correct: number;
  total: number;
  percentage: number;
}

interface LearningInsight {
  type: 'strength' | 'weakness' | 'suggestion';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const EnhancedResultPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [knowledgeAnalysis, setKnowledgeAnalysis] = useState<KnowledgePoint[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  
  if (!state.testResult) {
    return null;
  }

  const { correctAnswers, totalQuestions, score, timeSpent } = state.testResult;
  
  useEffect(() => {
    // 动画步骤
    const timer1 = setTimeout(() => setAnimationStep(1), 300);
    const timer2 = setTimeout(() => setAnimationStep(2), 600);
    const timer3 = setTimeout(() => setAnimationStep(3), 900);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    analyzeKnowledgePoints();
    generateLearningInsights();
    loadHistoricalData();
  }, [state.testResult]);

  const analyzeKnowledgePoints = () => {
    if (!state.testResult) return;
    
    // 使用新的知识点分析器分析当前测试
    
    // 使用新的知识点分析器分析当前测试
    const currentTestMap = KnowledgePointAnalyzer.analyzeTestKnowledgePoints(state.testResult);
    
    // 转换为显示格式
    const points: KnowledgePoint[] = Array.from(currentTestMap.entries()).map(([name, stats]) => ({
      name,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    })).sort((a, b) => b.total - a.total); // 按题目数量排序
    
    setKnowledgeAnalysis(points);
  };

  const generateLearningInsights = () => {
    const insights: LearningInsight[] = [];
    
    // 获取历史数据进行更深入的分析
    const allResults = storage.getTestResults();
    const categoryResults = allResults.filter(r => r.category === state.testResult!.category);
    
    // 基于总体表现的洞察
    if (score >= 90) {
      insights.push({
        type: 'strength',
        title: '表现卓越',
        description: `你的正确率达到了 ${score}%，掌握程度非常优秀！可以尝试更高难度的挑战。`,
        icon: <Trophy className="h-5 w-5 text-yellow-500" />
      });
    } else if (score >= 80) {
      insights.push({
        type: 'strength',
        title: '表现优秀',
        description: `你的正确率达到了 ${score}%，说明对这个知识领域掌握得很好！`,
        icon: <Star className="h-5 w-5 text-yellow-500" />
      });
    } else if (score >= 70) {
      insights.push({
        type: 'suggestion',
        title: '表现良好',
        description: `你的正确率为 ${score}%，基础扎实，再加把劲就能达到优秀水平！`,
        icon: <Target className="h-5 w-5 text-blue-500" />
      });
    } else if (score >= 60) {
      insights.push({
        type: 'weakness',
        title: '需要提升',
        description: `正确率为 ${score}%，建议重点复习薄弱知识点，多做针对性练习。`,
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
      });
    } else {
      insights.push({
        type: 'weakness',
        title: '需要加强',
        description: `正确率为 ${score}%，建议从基础概念开始系统性复习，循序渐进提升。`,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />
      });
    }
    
    // 基于知识点分析的洞察
    const weakPoints = knowledgeAnalysis.filter(point => point.percentage < 60);
    const strongPoints = knowledgeAnalysis.filter(point => point.percentage >= 80);
    
    if (strongPoints.length > 0) {
      insights.push({
        type: 'strength',
        title: '优势领域',
        description: `在 ${strongPoints.map(p => p.name).join('、')} 方面表现突出，继续保持！`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });
    }
    
    if (weakPoints.length > 0) {
      insights.push({
        type: 'weakness',
        title: '薄弱环节',
        description: `在 ${weakPoints.map(p => p.name).join('、')} 方面需要重点加强练习。`,
        icon: <XCircle className="h-5 w-5 text-red-500" />
      });
    }
    
    // 基于历史趋势的洞察
    if (categoryResults.length > 1) {
      const recentAvg = categoryResults.slice(-3).reduce((sum, r) => sum + r.score, 0) / Math.min(3, categoryResults.length);
      const olderAvg = categoryResults.slice(-6, -3).reduce((sum, r) => sum + r.score, 0) / Math.min(3, categoryResults.slice(-6, -3).length);
      
      if (recentAvg > olderAvg + 10) {
        insights.push({
          type: 'strength',
          title: '进步明显',
          description: `最近的表现比之前提升了 ${Math.round(recentAvg - olderAvg)}%，学习效果显著！`,
          icon: <TrendingUp className="h-5 w-5 text-green-500" />
        });
      } else if (recentAvg < olderAvg - 10) {
        insights.push({
          type: 'weakness',
          title: '需要调整',
          description: `最近表现有所下降，建议调整学习方法或适当休息。`,
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />
        });
      }
    }
    
    // 基于答题时间的洞察
    const avgTimePerQuestion = (timeSpent || 0) / totalQuestions;
    if (avgTimePerQuestion > 120) { // 超过2分钟每题
      insights.push({
        type: 'suggestion',
        title: '答题效率',
        description: '答题时间较长，建议提高解题速度，多做限时练习。',
        icon: <Clock className="h-5 w-5 text-blue-500" />
      });
    } else if (avgTimePerQuestion < 30 && score < 80) { // 少于30秒但正确率不高
      insights.push({
        type: 'suggestion',
        title: '答题策略',
        description: '答题速度较快但正确率有待提升，建议仔细审题，提高准确性。',
        icon: <Brain className="h-5 w-5 text-blue-500" />
      });
    }
    
    // 通用学习建议
    if (insights.length < 4) {
      insights.push({
        type: 'suggestion',
        title: '学习建议',
        description: '建议每天坚持练习15-30分钟，保持学习的连续性和规律性。',
        icon: <Lightbulb className="h-5 w-5 text-blue-500" />
      });
    }
    
    setLearningInsights(insights.slice(0, 4)); // 最多显示4个洞察
  };

  const loadHistoricalData = () => {
    const results = storage.getTestResults();
    const categoryResults = results.filter(r => r.category === state.testResult?.category);
    setHistoricalData(categoryResults.slice(-5)); // 最近5次
  };

  const wrongAnswers = state.testResult.questions.filter((question, index) => {
    return question.correctAnswer !== state.testResult!.userAnswers[index];
  });
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };



  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const getPerformanceLevel = () => {
    if (score >= 90) return { level: '优秀', color: 'text-green-600', icon: <Award className="h-6 w-6" /> };
    if (score >= 80) return { level: '良好', color: 'text-blue-600', icon: <Star className="h-6 w-6" /> };
    if (score >= 70) return { level: '中等', color: 'text-yellow-600', icon: <Target className="h-6 w-6" /> };
    if (score >= 60) return { level: '及格', color: 'text-orange-600', icon: <CheckCircle className="h-6 w-6" /> };
    return { level: '需提高', color: 'text-red-600', icon: <XCircle className="h-6 w-6" /> };
  };

  const performance = getPerformanceLevel();

  // 所见即所得 HTML 导出：克隆当前页面 DOM（移除脚本），打包成独立 HTML
  const exportSnapshotHTML = async () => {
    try {
      // 生成最新报告数据并在克隆前确保需要的动态区块已渲染（此页面已展示即可）
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      // 移除脚本 / 预加载，只保留样式与结构
      clone.querySelectorAll('script, link[rel="modulepreload"]').forEach(el => el.remove());
      // 去掉可能的运行时注入 dev overlay
      clone.querySelectorAll('#vite-dev-server, vite-error-overlay').forEach(el => el.remove());
      // 设置标题
      const headTitle = clone.querySelector('title');
      if (headTitle) headTitle.textContent = '学习报告快照';
      // 添加导出说明（仅快照文件中显示）
      const marker = document.createElement('div');
      marker.innerHTML = '<div style="margin:24px auto;max-width:960px;font:12px/1.4 system-ui,Arial,sans-serif;color:#64748b;text-align:center;">本文件为 QuizForge 结果页快照（静态），交互与登录功能已移除。可以使用浏览器打印为 PDF。</div>';
      const bodyEl = clone.querySelector('body');
      if (bodyEl) bodyEl.insertBefore(marker, bodyEl.firstChild);
      const htmlString = '<!DOCTYPE html>' + new XMLSerializer().serializeToString(clone);
      const blob = new Blob([htmlString], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `学习报告_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出 HTML 快照失败，回退到结构化 HTML:', e);
      const report = reportGenerator.generateReport(30);
      reportGenerator.downloadReport(report, 'html');
    }
  };

  const handleExport = async (type: 'pdf' | 'html') => {
    const report = reportGenerator.generateReport(30); // 默认30天窗口
    if (type === 'pdf') return await reportGenerator.exportToPDF(report);
    if (type === 'html') return exportSnapshotHTML();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="page-container layout-stable">
        <div className="max-w-6xl mx-auto">
          {/* 庆祝动画头部 */}
          <div className={`text-center mb-8 transition-all duration-1000 ${animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  {performance.icon}
                </div>
                {score >= 80 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <Zap className="h-4 w-4 text-yellow-800" />
                  </div>
                )}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              测试完成！
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
              恭喜你完成了这次测试，查看你的详细分析报告
            </p>
            
            <div className="flex justify-center items-center space-x-4">
              <Badge variant="outline" className={`${performance.color} text-lg px-4 py-2`}>
                {performance.level}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    导出报告
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>选择格式</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('html')}>
                    <FileText className="h-4 w-4 mr-2" /> 网页版 (推荐)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" /> PDF (实验性)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 核心指标卡片 */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 delay-300 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">答对题数</div>
                <Progress value={(correctAnswers / totalQuestions) * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">正确率</div>
                <Progress value={score} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatTime(timeSpent || 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">总用时</div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  平均 {Math.round((timeSpent || 0) / totalQuestions)}秒/题
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {historicalData.length > 1 ? 
                    (score > historicalData[historicalData.length - 2]?.score ? '+' : '') +
                    Math.round(score - (historicalData[historicalData.length - 2]?.score || score))
                    : '新'
                  }
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {historicalData.length > 1 ? '相比上次' : '首次测试'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 详细分析区域 */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-1000 delay-600 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* 知识点分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  知识点掌握度分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {knowledgeAnalysis.map((point, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {point.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {point.correct}/{point.total}
                          </span>
                          <Badge variant={point.percentage >= 80 ? 'default' : point.percentage >= 60 ? 'secondary' : 'destructive'}>
                            {point.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={point.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    知识点建议
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    {knowledgeAnalysis
                      .filter(p => p.percentage < 70)
                      .map((point, index) => (
                        <li key={index}>• 加强 {point.name} 的学习和练习</li>
                      ))
                    }
                    {knowledgeAnalysis.every(p => p.percentage >= 70) && (
                      <li>• 各知识点掌握良好，继续保持！</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 学习洞察 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  学习洞察与建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.type === 'strength' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                      insight.type === 'weakness' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {insight.icon}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 历史趋势 */}
                {historicalData.length > 1 && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      历史成绩趋势
                    </h4>
                    <div className="flex items-end space-x-2 h-20">
                      {historicalData.map((result, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-blue-500 rounded-t"
                            style={{ height: `${(result.score / 100) * 60}px` }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {result.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 错题分析 */}
          {wrongAnswers.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    错题分析 ({wrongAnswers.length} 题)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showDetailedAnalysis ? '隐藏' : '查看'}详情
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{wrongAnswers.length}</div>
                    <div className="text-sm text-red-700 dark:text-red-300">错题总数</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round((wrongAnswers.length / totalQuestions) * 100)}%
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">错误率</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {wrongAnswers.length > 0 ? '需复习' : '无'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">建议行动</div>
                  </div>
                </div>

                {showDetailedAnalysis && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">错题详情:</h4>
                    {wrongAnswers.slice(0, 3).map((question, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          {question.question}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="text-red-600">你的答案:</span> {question.options[state.testResult!.userAnswers[state.testResult!.questions.indexOf(question)]]} <br />
                          <span className="text-green-600">正确答案:</span> {question.options[question.correctAnswer]}
                        </div>
                      </div>
                    ))}
                    {wrongAnswers.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        还有 {wrongAnswers.length - 3} 道错题，可在错题本中查看
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">复习建议</h4>
                  <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                    <li>• 这些题目已自动加入错题本，建议重点复习</li>
                    <li>• 分析错误原因，是概念不清还是粗心大意</li>
                    <li>• 针对薄弱知识点进行专项练习</li>
                    <li>• 建议1-2天后重新测试这些错题</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                <BookOpen className="h-4 w-4 mr-2" />
                查看错题本
              </Button>
            )}
            
            <Button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'analytics' })}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              学习分析
            </Button>
            
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
    </div>
  );
};