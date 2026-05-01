import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Key,
  AlertCircle,
  Sparkles,
  Eye,
  X,
  Check,
  Menu,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  Star,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { apiKeyUtils } from '@/utils/apiKeyUtils';
import { AIService } from '@/utils/aiService';
import { storage } from '@/utils/storage';
// 删除不存在的 GenerationResult 类型
import { SiteIcon } from '@/components/icons/SiteIcon';
import { GenerationAnalytics } from '@/utils/generationAnalytics';
import { SmartGenerationAssistant } from './SmartGenerationAssistant';
import { BatchGenerationTool } from './BatchGenerationTool';
import { useMobile, MobileUtils } from '@/utils/mobileUtils';
import { BackButton } from '@/components/BackButton';

export const GeneratePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isMobile, isTouchDevice } = useMobile();
  
  // 用户的付费 API Keys（非内置）
  const userPaidKeys = isAuthenticated && user
    ? apiKeyUtils.getUserApiKeys(user.id).filter(k => !k.isBuiltIn)
    : [];
  const userApiKey = isAuthenticated && user ? apiKeyUtils.getDefaultApiKey(user.id) : null;
  
  const [selectedCategory, setSelectedCategory] = useState('java');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  // strategy 已移除（用户不再可配置，内部逻辑统一交给 AIService 自适应）
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 新增状态 - 渐进式添加
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [modelHealth, setModelHealth] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  
  // 新增智能功能状态
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'assistant'>('single');
  const [qualityAnalysis, setQualityAnalysis] = useState<any>(null);
  const [duplicateDetection, setDuplicateDetection] = useState<any>(null);
  
  // 移动端特有状态
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    settings: true,
    info: false
  });
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null); // null = 使用免费模型
  const modelPickerRef = React.useRef<HTMLDivElement | null>(null);

  // 点击外部关闭模型选择器
  useEffect(() => {
    if (!showModelPicker) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modelPickerRef.current && !modelPickerRef.current.contains(target)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showModelPicker]);

  // 初始化移动端优化
  useEffect(() => {
    MobileUtils.initMobileOptimizations();
  }, []);

  // 初始化用户的内置 API Key
  useEffect(() => {
    if (isAuthenticated && user) {
      // 为登录用户初始化内置 API Key
      apiKeyUtils.initializeBuiltInApiKey(user.id);
    }
  }, [isAuthenticated, user]);

  // 加载模型健康状态
  useEffect(() => {
    updateModelHealth();
  }, []);

  const updateModelHealth = () => {
    try {
      const health = AIService.getModelHealth();
      setModelHealth(health);
    } catch (error) {
      console.warn('获取模型健康状态失败:', error);
    }
  };

  const categories = [
    { id: 'java', name: 'Java', icon: '☕', description: 'Java基础语法、面向对象、集合框架、多线程等' },
    { id: 'python', name: 'Python', icon: '🐍', description: 'Python语法、数据结构、Web开发、机器学习等' },
    { id: 'javascript', name: 'JavaScript', icon: '🟨', description: 'ES6+语法、异步编程、前端框架、Node.js等' },
    { id: 'database', name: '数据库', icon: '🗄️', description: 'SQL查询、数据库设计、索引优化、事务等' },
    { id: 'algorithm', name: '算法与数据结构', icon: '🧮', description: '排序算法、树、图、动态规划、时间复杂度等' },
    { id: 'system-design', name: '系统设计', icon: '🏗️', description: '架构设计、分布式系统、微服务、负载均衡等' },
    { id: 'operating-system', name: '操作系统', icon: '💻', description: '进程线程、内存管理、文件系统、网络编程等' },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 移除 API Key 保存逻辑，现在统一在 API Key 管理页面处理

  const navigateToApiKeyManager = () => {
    navigate('/api-keys');
  };

  const handleGenerate = async () => {
    // 注释掉认证检查，允许使用内置API Key
    // if (!isAuthenticated) {
    //   dispatch({ type: 'SET_ERROR', payload: '请先登录 Google 账号使用免费模型' });
    //   return;
    // }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('准备生成...');
    setQualityAnalysis(null);
    setDuplicateDetection(null);
    dispatch({ type: 'CLEAR_ERROR' });

    const startTime = Date.now();
    let modelInfo = AIService.getCurrentModelInfo(); // 初始值，生成后会更新为实际模型

    try {
      setCurrentStep('正在生成题目...');
      setGenerationProgress(30);

      const questions = await AIService.generateQuestions({
        category: selectedCategory,
        count: parseInt(questionCount),
        difficulty,
        userId: user?.id,
        keyId: selectedKeyId ?? undefined,
      });

      // 生成完成后更新为实际使用的模型
      modelInfo = AIService.getCurrentModelInfo();

      // 如果用户已登录，更新API Key的最后使用时间
      if (isAuthenticated && user && userApiKey) {
        apiKeyUtils.updateLastUsed(user.id, userApiKey.id);
      }

      setCurrentStep('分析题目质量...');
      setGenerationProgress(60);

      // 质量分析
      const qualityScores = questions.map(q => GenerationAnalytics.evaluateQuestionQuality(q));
      const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

      // 重复检测
      const duplicateResult = GenerationAnalytics.detectDuplicates(questions);

      setCurrentStep('保存题目到本地...');
      setGenerationProgress(80);

      storage.addQuestions(questions);
      dispatch({ type: 'ADD_QUESTIONS', payload: questions });

      // 记录生成历史
      const generationTime = Date.now() - startTime;
      GenerationAnalytics.recordGeneration({
        category: selectedCategory,
        difficulty,
        requestedCount: parseInt(questionCount),
        actualCount: questions.length,
        modelUsed: modelInfo.name,
        generationTime,
        qualityScore: averageQuality,
        duplicateCount: duplicateResult.duplicateCount
      });

      setGenerationProgress(100);
      setCurrentStep('生成完成！');

      // 设置分析结果
      setQualityAnalysis({
        averageQuality,
        qualityScores,
        questions
      });
      setDuplicateDetection(duplicateResult);

      dispatch({
        type: 'SET_ERROR',
        payload: `🎉 成功生成 ${questions.length} 道 ${categories.find(c => c.id === selectedCategory)?.name} 题目！平均质量: ${Math.round(averageQuality)}% | 使用模型: ${modelInfo.name}`
      });
      
      // Clear success message after 8 seconds
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
        setCurrentStep('');
        setGenerationProgress(0);
      }, 8000);
      
    } catch (error) {
      // 记录失败的生成
      GenerationAnalytics.recordGeneration({
        category: selectedCategory,
        difficulty,
        requestedCount: parseInt(questionCount),
        actualCount: 0,
        modelUsed: modelInfo.name,
        generationTime: Date.now() - startTime
      });

      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '生成题目失败，请检查API Key或网络连接' 
      });
    } finally {
      setIsGenerating(false);
      updateModelHealth();
    }
  };

  const handlePreviewGeneration = async () => {
    // 注释掉认证检查，允许使用内置API Key
    // if (!isAuthenticated) {
    //   dispatch({ type: 'SET_ERROR', payload: '请先登录 Google 账号使用免费模型' });
    //   return;
    // }

    setIsGenerating(true);
    setCurrentStep('生成预览题目...');
    
    try {
      // 预览生成的题目数量：最少3道，最多与用户选择数量一致，但不超过10道
      const previewCount = Math.min(Math.max(3, parseInt(questionCount)), 10);
      
      const questions = await AIService.generateQuestions({
        category: selectedCategory,
        count: previewCount,
        difficulty,
        userId: user?.id,
        keyId: selectedKeyId ?? undefined,
      });
      
      // 如果用户已登录，更新API Key的最后使用时间
      if (isAuthenticated && user && userApiKey) {
        apiKeyUtils.updateLastUsed(user.id, userApiKey.id);
      }

      setPreviewQuestions(questions);
      setShowPreview(true);
      setCurrentStep('');
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '预览生成失败' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePreviewQuestions = () => {
    if (previewQuestions.length === 0) return;

    const startTime = Date.now();
    const modelInfo = AIService.getCurrentModelInfo();

    try {
      setCurrentStep('保存预览题目到本地...');
      
      // 质量分析
      const qualityScores = previewQuestions.map(q => GenerationAnalytics.evaluateQuestionQuality(q));
      const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

      // 重复检测
      const duplicateResult = GenerationAnalytics.detectDuplicates(previewQuestions);

      storage.addQuestions(previewQuestions);
      dispatch({ type: 'ADD_QUESTIONS', payload: previewQuestions });

      // 记录生成历史
      const generationTime = Date.now() - startTime;
      GenerationAnalytics.recordGeneration({
        category: selectedCategory,
        difficulty,
        requestedCount: previewQuestions.length,
        actualCount: previewQuestions.length,
        modelUsed: modelInfo.name,
        generationTime,
        qualityScore: averageQuality,
        duplicateCount: duplicateResult.duplicateCount
      });
      
      // 设置分析结果
      setQualityAnalysis({
        averageQuality,
        qualityScores,
        questions: previewQuestions
      });
      setDuplicateDetection(duplicateResult);
      
      setShowPreview(false);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `🎉 成功保存 ${previewQuestions.length} 道 ${categories.find(c => c.id === selectedCategory)?.name} 题目！平均质量: ${Math.round(averageQuality)}%` 
      });
      
      // Clear success message after 8 seconds
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
        setCurrentStep('');
      }, 8000);
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '保存题目失败' 
      });
    } finally {
      updateModelHealth();
    }
  };

  const getCategoryQuestionCount = (categoryId: string) => {
    return storage.getQuestionsByCategory(categoryId).length;
  };

  // 处理智能推荐应用
  const handleApplyRecommendation = (type: string, value: string | number) => {
    switch (type) {
      case 'category':
        setSelectedCategory(value as string);
        break;
      case 'difficulty':
        setDifficulty(value as string);
        break;
      case 'count':
        setQuestionCount(value.toString());
        break;
    }
  };

  // 处理批量生成
  const handleBatchGenerate = async (batchItems: any[]) => {
    // 注释掉认证检查，允许使用内置API Key
    // if (!isAuthenticated) {
    //   dispatch({ type: 'SET_ERROR', payload: '请先登录 Google 账号使用免费模型' });
    //   return;
    // }

    setIsGenerating(true);
    dispatch({ type: 'CLEAR_ERROR' });

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      
      try {
        // 更新当前项目状态
        item.status = 'generating';
        item.progress = 0;
        
        setCurrentStep(`正在生成第 ${i + 1}/${batchItems.length} 个任务: ${categories.find(c => c.id === item.category)?.name}`);
        
        const startTime = Date.now();
        item.progress = 30;

        const questions = await AIService.generateQuestions({
          category: item.category,
          count: item.count,
          difficulty: item.difficulty,
          userId: user?.id,
          keyId: selectedKeyId ?? undefined,
        });

        // 生成完成后读取实际使用的模型
        const modelInfo = AIService.getCurrentModelInfo();
        
        // 如果用户已登录，更新API Key的最后使用时间
        if (isAuthenticated && user && userApiKey) {
          apiKeyUtils.updateLastUsed(user.id, userApiKey.id);
        }

        item.progress = 80;

        // 质量分析
        const qualityScores = questions.map(q => GenerationAnalytics.evaluateQuestionQuality(q));
        const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

        // 重复检测
        const duplicateResult = GenerationAnalytics.detectDuplicates(questions);

        storage.addQuestions(questions);
        dispatch({ type: 'ADD_QUESTIONS', payload: questions });

        // 记录生成历史
        GenerationAnalytics.recordGeneration({
          category: item.category,
          difficulty: item.difficulty,
          requestedCount: item.count,
          actualCount: questions.length,
          modelUsed: modelInfo.name,
          generationTime: Date.now() - startTime,
          qualityScore: averageQuality,
          duplicateCount: duplicateResult.duplicateCount
        });

        item.status = 'completed';
        item.progress = 100;
        item.generatedCount = questions.length;

      } catch (error) {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : '生成失败';
        
        // 记录失败
        const modelInfo = AIService.getCurrentModelInfo();
        GenerationAnalytics.recordGeneration({
          category: item.category,
          difficulty: item.difficulty,
          requestedCount: item.count,
          actualCount: 0,
          modelUsed: modelInfo.name,
          generationTime: 0
        });
      }
    }

    const successCount = batchItems.filter(item => item.status === 'completed').length;
    const totalQuestions = batchItems
      .filter(item => item.status === 'completed')
      .reduce((sum, item) => sum + (item.generatedCount || 0), 0);

    dispatch({ 
      type: 'SET_ERROR', 
      payload: `🎉 批量生成完成！成功 ${successCount}/${batchItems.length} 个任务，共生成 ${totalQuestions} 道题目 | 使用模型: ${AIService.getCurrentModelInfo().name}` 
    });

    setTimeout(() => {
      dispatch({ type: 'CLEAR_ERROR' });
      setCurrentStep('');
    }, 8000);

    setIsGenerating(false);
    updateModelHealth();
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? 'pb-safe-bottom' : ''}`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'pt-safe-top' : ''}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <BackButton to="home" label={isMobile ? '返回' : '返回'} size="sm" className={isMobile ? 'p-2' : ''} />
            <div>
              <h1 className={`font-bold text-gray-900 dark:text-foreground ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                AI智能出题
              </h1>
              {!isMobile && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  使用先进AI技术生成高质量面试题目
                </p>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          {/* Desktop Model Status */}
          {/* 移除顶部模型选择器（见截图1要求） */}
        </div>

        {/* Mobile Menu */}
        {isMobile && showMobileMenu && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={activeTab === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('single')}
                >
                  单次生成
                </Button>
                <Button
                  variant={activeTab === 'batch' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('batch')}
                >
                  批量生成
                </Button>
                <Button
                  variant={activeTab === 'assistant' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('assistant')}
                >
                  智能助手
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Status and Progress */}
      {(state.error || isGenerating) && (
        <Alert className={`mb-6 ${state.error?.includes('成功') || state.error?.includes('🎉') ? 'border-green-200 bg-green-50 dark:bg-green-950' : ''}`}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <SiteIcon className={`h-4 w-4 ${state.error?.includes('成功') || state.error?.includes('🎉') ? 'text-green-700 dark:text-green-300' : 'text-primary'}`} />
          )}
          <AlertDescription className={state.error?.includes('成功') || state.error?.includes('🎉') ? 'text-green-800 dark:text-green-200' : ''}>
            {isGenerating ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>{currentStep || '准备生成...'}</span>
                  <span className="text-sm">{generationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              state.error
            )}
          </AlertDescription>
        </Alert>
      )}

        {/* 未登录用户提示 */}
        {!isAuthenticated && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <SiteIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>登录Google账户享受免费AI出题功能</span>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/api/auth/sign-in/google'}
                  >
                    Google登录
                  </Button>
                </div>
                <div className="text-sm">
                  ✨ 免费使用5个AI模型 • 管理多个API Keys • 云端同步题库
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 已登录用户状态显示 */}
        {isAuthenticated && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 dark:text-green-200">已登录，可使用免费AI模型</span>
                  {modelHealth && (
                    <div className="relative" ref={modelPickerRef}>
                      <Badge
                        variant={selectedKeyId ? 'default' : 'secondary'}
                        role="button"
                        tabIndex={0}
                        aria-haspopup="listbox"
                        aria-expanded={showModelPicker}
                        className={`${isMobile ? 'text-xs' : ''} cursor-pointer select-none flex items-center gap-1 hover:ring-2 hover:ring-primary/30 transition`}
                        onClick={() => setShowModelPicker((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowModelPicker((v) => !v); }
                          else if (e.key === 'Escape') setShowModelPicker(false);
                        }}
                        title="点击切换模型"
                      >
                        {selectedKeyId
                          ? (() => {
                              const k = userPaidKeys.find(k => k.id === selectedKeyId);
                              return k ? `${k.name}${k.model ? ` · ${k.model}` : ''}` : '付费模型';
                            })()
                          : 'openrouter/free'}
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </Badge>
                      {showModelPicker && (
                        <div className="absolute left-0 z-20 mt-2 w-72 bg-popover border rounded-md shadow-md p-2">
                          {/* 免费模型区 */}
                          <div className="text-xs text-muted-foreground px-2 pb-1 font-medium">免费模型</div>
                          <div role="listbox">
                            {(() => {
                              const active = !selectedKeyId;
                              return (
                                <button
                                  role="option"
                                  aria-selected={active}
                                  className={`w-full flex items-start justify-between text-left px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground ${active ? 'bg-accent/70' : ''}`}
                                  onClick={() => {
                                    setSelectedKeyId(null);
                                    setShowModelPicker(false);
                                    updateModelHealth();
                                  }}
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm">Free Models Router</div>
                                    <div className="text-xs text-muted-foreground font-mono">openrouter/free</div>
                                  </div>
                                  {active && <Check className="h-4 w-4 opacity-80 flex-shrink-0 mt-0.5" />}
                                </button>
                              );
                            })()}
                          </div>
                          {/* 付费 key 区 */}
                          {userPaidKeys.length > 0 && (
                            <>
                              <div className="border-t my-1" />
                              <div className="text-xs text-muted-foreground px-2 pb-1 font-medium">我的 API Keys（付费）</div>
                              {userPaidKeys.map((k) => {
                                const active = selectedKeyId === k.id;
                                return (
                                  <button
                                    key={k.id}
                                    role="option"
                                    aria-selected={active}
                                    className={`w-full flex items-start justify-between text-left px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground ${active ? 'bg-accent/70' : ''}`}
                                    onClick={() => {
                                      setSelectedKeyId(k.id);
                                      setShowModelPicker(false);
                                    }}
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm truncate">{k.name}</div>
                                      <div className="text-xs text-muted-foreground">{k.model || k.provider}</div>
                                    </div>
                                    {active && <Check className="h-4 w-4 opacity-80 flex-shrink-0 mt-0.5" />}
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={navigateToApiKeyManager}
                  className={isMobile ? 'w-full mt-3' : ''}
                >
                  <Key className="h-4 w-4 mr-2" />
                  管理 API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on active tab */}
        {activeTab === 'single' && (
          <>
            {/* Generation Settings - Collapsible on mobile */}
            <Card>
              <CardHeader 
                className={`${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleSection('settings') : undefined}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    生成设置
                  </div>
                  {isMobile && (
                    expandedSections['settings'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {(!isMobile || expandedSections['settings']) && (
                <CardContent className="space-y-6">
                  {/* Category Selection */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">选择类别</Label>
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                      {categories.map(category => (
                        <div
                          key={category.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${isTouchDevice ? 'active:scale-95' : ''} ${
                            selectedCategory === category.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{category.icon}</span>
                              <h3 className={`font-medium text-gray-900 dark:text-foreground ${isMobile ? 'text-sm' : ''}`}>
                                {category.name}
                              </h3>
                            </div>
                            <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>
                              {getCategoryQuestionCount(category.id)} 题
                            </Badge>
                          </div>
                          <p className={`text-gray-600 dark:text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {category.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generation Options */}
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                    <div>
                      <Label htmlFor="question-count">题目数量</Label>
                      <Select value={questionCount} onValueChange={setQuestionCount}>
                        <SelectTrigger className={isMobile ? 'h-12 text-base' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 题</SelectItem>
                          <SelectItem value="10">10 题</SelectItem>
                          <SelectItem value="15">15 题</SelectItem>
                          <SelectItem value="20">20 题</SelectItem>
                          <SelectItem value="30">30 题</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">难度级别</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className={isMobile ? 'h-12 text-base' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单 (初级)</SelectItem>
                          <SelectItem value="medium">中等 (中级)</SelectItem>
                          <SelectItem value="hard">困难 (高级)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 生成策略选择已按需求移除 */}
                  </div>
                </CardContent>
              )}
            </Card>
          </>
        )}

      {activeTab === 'batch' && (
        <BatchGenerationTool
          onGenerate={handleBatchGenerate}
          isGenerating={isGenerating}
        />
      )}

      {activeTab === 'assistant' && (
        <SmartGenerationAssistant
          onApplyRecommendation={handleApplyRecommendation}
          currentSettings={{
            category: selectedCategory,
            difficulty,
            count: questionCount
          }}
        />
      )}

        {/* Generation Info and Tips - Only show for single generation */}
        {activeTab === 'single' && (
          <>
            {/* Info Section - Collapsible on mobile */}
            <Card>
              <CardHeader 
                className={`${isMobile ? 'cursor-pointer' : ''}`}
                onClick={isMobile ? () => toggleSection('info') : undefined}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    使用说明
                  </div>
                  {isMobile && (
                    expandedSections['info'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {(!isMobile || expandedSections['info']) && (
                <CardContent className="p-6">
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className={`font-medium text-gray-900 dark:text-foreground mb-2 ${isMobile ? 'text-sm' : ''}`}>
                          生成说明
                        </h3>
                        <ul className={`text-gray-600 dark:text-muted-foreground space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <li>• AI将根据选择的类别和难度生成相应的面试题目</li>
                          <li>• 每道题目包含题干、4个选项、正确答案和详细解析</li>
                          <li>• 生成的题目会自动保存到本地题库中</li>
                          <li>• 预览功能：生成3-10道题目供预览（根据选择数量调整）</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className={`font-medium text-gray-900 dark:text-foreground mb-2 ${isMobile ? 'text-sm' : ''}`}>
                          智能优化
                        </h3>
                        <ul className={`text-gray-600 dark:text-muted-foreground space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <li>• 自动质量评估和重复检测</li>
                          <li>• 基于历史数据的智能推荐</li>
                          <li>• 支持批量生成和模板保存</li>
                          <li>• 详细的生成分析和统计</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quality Analysis Results */}
            {qualityAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    质量分析结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} gap-4 mb-4`}>
                    <div className={`text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg ${isMobile ? 'p-3' : ''}`}>
                      <div className={`font-bold text-blue-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                        {Math.round(qualityAnalysis.averageQuality)}%
                      </div>
                      <div className={`text-gray-600 dark:text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        平均质量
                      </div>
                    </div>
                    <div className={`text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg ${isMobile ? 'p-3' : ''}`}>
                      <div className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                        {qualityAnalysis.qualityScores.filter((score: number) => score >= 80).length}
                      </div>
                      <div className={`text-gray-600 dark:text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        优质题目
                      </div>
                    </div>
                    <div className={`text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg ${isMobile ? 'p-3' : ''}`}>
                      <div className={`font-bold text-yellow-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                        {duplicateDetection?.duplicateCount || 0}
                      </div>
                      <div className={`text-gray-600 dark:text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        重复题目
                      </div>
                    </div>
                  </div>

                  {duplicateDetection && duplicateDetection.duplicateCount > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className={`text-yellow-800 dark:text-yellow-200 ${isMobile ? 'text-sm' : ''}`}>
                        检测到 {duplicateDetection.duplicateCount} 道重复或相似题目，建议重新生成或手动筛选。
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-center space-x-4'}`}>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !isAuthenticated}
                  className={`bg-blue-600 hover:bg-blue-700 ${isMobile ? 'w-full h-12 text-base' : 'text-lg px-8 py-3'}`}
                  size={isMobile ? 'default' : 'lg'}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      智能生成 {questionCount} 道题目
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handlePreviewGeneration}
                  disabled={isGenerating || !isAuthenticated}
                  className={isMobile ? 'w-full h-12 text-base' : ''}
                  size={isMobile ? 'default' : 'lg'}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  预览 {Math.min(Math.max(3, parseInt(questionCount)), 10)} 道题目
                </Button>
              </div>
              
              {!isAuthenticated && (
                <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  请先登录 Google 账号以使用AI生成功能
                </p>
              )}
              
              {modelHealth && modelHealth.failedModels.length > 0 && (
                <div className={`flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-center">
                    {modelHealth.failedModels.length} 个模型异常，系统将自动切换到可用模型
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Preview Modal - Mobile Optimized */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className={`w-full ${isMobile ? 'max-h-[90vh]' : 'max-w-4xl max-h-[80vh]'} overflow-hidden`}>
              <CardHeader className={isMobile ? 'pb-3' : ''}>
                <div className="flex items-center justify-between">
                  <CardTitle className={isMobile ? 'text-lg' : ''}>
                    预览生成效果 ({previewQuestions.length} 道题目)
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreview(false)}
                    size={isMobile ? 'sm' : 'default'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh] p-6 preview-scroll">
                <div className="space-y-4">
                  {previewQuestions.map((question, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className={`font-medium text-gray-900 dark:text-foreground mb-3 ${isMobile ? 'text-sm' : ''}`}>
                        {index + 1}. {question.question}
                      </h4>
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-2 mb-3`}>
                        {question.options.map((option: string, optIndex: number) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded border ${isMobile ? 'text-sm' : ''} ${
                              optIndex === question.correctAnswer
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      <div className={`text-gray-600 dark:text-muted-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
                        <strong>解析:</strong> {question.explanation}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'} mt-6 pt-4 border-t`}>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreview(false)}
                    className={isMobile ? 'w-full' : ''}
                  >
                    关闭预览
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      handleGenerate();
                    }}
                    className={isMobile ? 'w-full' : ''}
                  >
                    重新生成 {questionCount} 道题目
                  </Button>
                  <Button 
                    onClick={handleSavePreviewQuestions}
                    className={isMobile ? 'w-full' : ''}
                  >
                    保存这些题目
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};