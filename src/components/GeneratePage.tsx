import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Loader2, 
  Key, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Settings,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { AIService } from '@/utils/aiService';
import { storage } from '@/utils/storage';

export const GeneratePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(state.apiKey || '');
  const [selectedCategory, setSelectedCategory] = useState('java');
  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!state.apiKey);

  const categories = [
    { id: 'java', name: 'Java', description: 'Java基础语法、面向对象、集合框架、多线程等' },
    { id: 'python', name: 'Python', description: 'Python语法、数据结构、Web开发、机器学习等' },
    { id: 'javascript', name: 'JavaScript', description: 'ES6+语法、异步编程、前端框架、Node.js等' },
    { id: 'database', name: '数据库', description: 'SQL查询、数据库设计、索引优化、事务等' },
    { id: 'algorithm', name: '算法与数据结构', description: '排序算法、树、图、动态规划、时间复杂度等' },
    { id: 'system-design', name: '系统设计', description: '架构设计、分布式系统、微服务、负载均衡等' },
    { id: 'operating-system', name: '操作系统', description: '进程线程、内存管理、文件系统、网络编程等' },
  ];

  const handleSaveApiKey = () => {
    if (!AIService.validateApiKey(apiKey)) {
      dispatch({ type: 'SET_ERROR', payload: 'API Key 格式不正确，应该以 sk- 开头' });
      return;
    }
    
    storage.saveApiKey(apiKey);
    dispatch({ type: 'SET_API_KEY', payload: apiKey });
    setShowApiKeyInput(false);
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      dispatch({ type: 'SET_ERROR', payload: '请先设置 OpenRouter API Key' });
      return;
    }

    setIsGenerating(true);
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const questions = await AIService.generateQuestions({
        category: selectedCategory,
        count: parseInt(questionCount),
        difficulty,
        apiKey,
      });

      storage.addQuestions(questions);
      dispatch({ type: 'ADD_QUESTIONS', payload: questions });
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `成功生成 ${questions.length} 道 ${categories.find(c => c.id === selectedCategory)?.name} 题目！` 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' });
      }, 3000);
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '生成题目失败，请检查API Key或网络连接' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryQuestionCount = (categoryId: string) => {
    return storage.getQuestionsByCategory(categoryId).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] layout-stable">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'home' })}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI自动出题</h1>
          <p className="text-gray-600 mt-2">使用AI技术生成高质量的面试题目</p>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <Alert className={`mb-6 ${state.error.includes('成功') ? 'border-green-200 bg-green-50' : ''}`}>
          {state.error.includes('成功') ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className={state.error.includes('成功') ? 'text-green-800' : ''}>
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Key 设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showApiKeyInput ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">OpenRouter API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  请输入你的 OpenAI API Key，用于调用AI生成题目
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  保存并使用
                </Button>
                {state.apiKey && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApiKeyInput(false)}
                  >
                    取消
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">API Key 已设置</span>
                <Badge variant="outline">
                  {apiKey.substring(0, 7)}...{apiKey.substring(apiKey.length - 4)}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowApiKeyInput(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                修改
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            生成设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">选择类别</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCategory === category.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <Badge variant="outline">
                      {getCategoryQuestionCount(category.id)} 题
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="question-count">题目数量</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单 (初级)</SelectItem>
                  <SelectItem value="medium">中等 (中级)</SelectItem>
                  <SelectItem value="hard">困难 (高级)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Info */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">生成说明</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI将根据选择的类别和难度生成相应的面试题目</li>
                <li>• 每道题目包含题干、4个选项、正确答案和详细解析</li>
                <li>• 生成的题目会自动保存到本地题库中</li>
                <li>• 生成过程可能需要1-2分钟，请耐心等待</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="text-center">
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !apiKey}
          className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              正在生成题目...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              开始生成 {questionCount} 道题目
            </>
          )}
        </Button>
        
        {!apiKey && (
          <p className="text-sm text-gray-500 mt-2">
            请先设置 API Key 以使用AI生成功能
          </p>
        )}
      </div>
    </div>
  );
};