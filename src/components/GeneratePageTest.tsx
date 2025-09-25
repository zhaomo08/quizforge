import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIService } from '@/utils/aiService';
import { useAuth } from '@/components/auth/AuthProvider';
import { apiKeyUtils } from '@/utils/apiKeyUtils';

// 调试和测试组件
export const GeneratePageTest: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingGeneration, setIsTestingGeneration] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const clearResults = () => {
    setTestResults([]);
    console.clear();
  };

  // 直接测试 OpenRouter API 调用
  const testDirectApiCall = async () => {
    setIsTestingApi(true);
    clearResults();
    addResult('=== 直接 API 调用测试 ===');

    const envApiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
    addResult(`使用 API Key: ${envApiKey ? `${envApiKey.substring(0, 15)}...` : '未设置'}`);

    if (!envApiKey) {
      addResult('❌ 环境变量中没有 API Key');
      setIsTestingApi(false);
      return;
    }

    // 测试最简单的模型调用
    const testModel = 'deepseek/deepseek-chat-v3.1:free';
    addResult(`🤖 测试模型: ${testModel}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      addResult('📡 发送请求到 OpenRouter...');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${envApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Interview Assistant',
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            {
              role: 'user',
              content: '请回答：1+1等于几？只需要回答数字。',
            },
          ],
          max_tokens: 100,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      addResult(`📊 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addResult(`❌ 请求失败: ${errorText}`);
        
        // 尝试解析错误信息
        try {
          const errorData = JSON.parse(errorText);
          addResult(`错误详情: ${JSON.stringify(errorData, null, 2)}`);
        } catch {
          addResult(`原始错误: ${errorText}`);
        }
      } else {
        const data = await response.json();
        addResult('✅ 请求成功！');
        addResult(`响应数据: ${JSON.stringify(data, null, 2)}`);
        
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          addResult(`✅ 模型回复: ${content}`);
        } else {
          addResult('❌ 响应中没有内容');
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          addResult('❌ 请求超时');
        } else {
          addResult(`❌ 网络错误: ${error.message}`);
        }
      } else {
        addResult(`❌ 未知错误: ${String(error)}`);
      }
    } finally {
      setIsTestingApi(false);
      addResult('=== API 测试完成 ===');
    }
  };

  const testBasicFunctions = () => {
    clearResults();
    addResult('=== AI生成页面功能测试开始 ===');

    // 测试环境变量 - 多种方式
    const envApiKey1 = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
    const envApiKey2 = import.meta.env?.VITE_OPENROUTER_API_KEY;
    const projectKey = AIService.getProjectApiKey();
    
    addResult(`方式1 - (import.meta as any).env: ${envApiKey1 ? `${envApiKey1.substring(0, 15)}...` : '未设置'}`);
    addResult(`方式2 - import.meta.env: ${envApiKey2 ? `${envApiKey2.substring(0, 15)}...` : '未设置'}`);
    addResult(`AIService 获取: ${projectKey ? `${projectKey.substring(0, 15)}...` : '未设置'}`);

    // 检查是否是示例密钥
    if (envApiKey1 && envApiKey1.includes('demo-key')) {
      addResult('⚠️  检测到示例密钥，这可能是缓存问题');
    }

    // 测试用户状态
    addResult(`用户登录状态: ${isAuthenticated ? '已登录' : '未登录'}`);
    if (user) {
      addResult(`用户ID: ${user.id}`);
    }

    // 测试用户的 API Key
    if (isAuthenticated && user) {
      const userApiKey = apiKeyUtils.getDefaultApiKey(user.id);
      addResult(`用户默认 API Key: ${userApiKey ? '已设置' : '未设置'}`);
    }

    // 测试 AIService 方法
    try {
      const modelHealth = AIService.getModelHealth();
      addResult(`✅ 模型健康状态: 当前模型 ${modelHealth.currentModel.name}, 失败模型 ${modelHealth.failedModels.length} 个`);
    } catch (error) {
      addResult(`❌ getModelHealth 失败: ${error}`);
    }

    try {
      const currentModel = AIService.getCurrentModelInfo();
      addResult(`✅ 当前模型: ${currentModel.name} (${currentModel.index + 1}/${currentModel.total})`);
    } catch (error) {
      addResult(`❌ getCurrentModelInfo 失败: ${error}`);
    }

    // 测试 API Key 验证
    const keyToTest = envApiKey1 || envApiKey2 || projectKey;
    if (keyToTest) {
      const isValid = AIService.validateApiKey(keyToTest);
      addResult(`API Key 验证: ${isValid ? '✅ 有效' : '❌ 无效'}`);
    }

    addResult('=== 基础测试完成 ===');
  };

  const testGeneration = async () => {
    if (!isAuthenticated) {
      addResult('❌ 请先登录 Google 账号');
      return;
    }

    setIsTestingGeneration(true);
    addResult('=== 开始测试题目生成 ===');

    try {
      addResult('🚀 开始生成 1 道 Java 测试题目...');
      
      const questions = await AIService.generateQuestions({
        category: 'java',
        count: 1,
        difficulty: 'medium',
        userId: user?.id,
      });

      addResult(`✅ 生成成功！获得 ${questions.length} 道题目`);
      if (questions.length > 0) {
        addResult(`题目示例: ${questions[0].question.substring(0, 50)}...`);
      }

    } catch (error) {
      addResult(`❌ 生成失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTestingGeneration(false);
      addResult('=== 生成测试完成 ===');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI生成功能调试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testBasicFunctions} variant="outline">
              基础功能测试
            </Button>
            <Button 
              onClick={testDirectApiCall} 
              disabled={isTestingApi}
              variant="secondary"
            >
              {isTestingApi ? '测试中...' : '直接 API 测试'}
            </Button>
            <Button 
              onClick={testGeneration} 
              disabled={!isAuthenticated || isTestingGeneration}
              variant="default"
            >
              {isTestingGeneration ? '生成中...' : '测试题目生成'}
            </Button>
            <Button onClick={clearResults} variant="ghost">
              清空结果
            </Button>
          </div>

          {!isAuthenticated && (
            <Alert>
              <AlertDescription>
                请先登录 Google 账号才能测试题目生成功能
              </AlertDescription>
            </Alert>
          )}

          {testResults.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">测试结果:</h4>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className={
                    result.includes('✅') ? 'text-green-600' :
                    result.includes('❌') ? 'text-red-600' :
                    result.includes('🚀') || result.includes('📡') ? 'text-blue-600' :
                    'text-gray-600'
                  }>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};