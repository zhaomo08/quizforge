import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { signIn, useSession } from '@/lib/auth-client';
import { 
  getGoogleOAuthConfig, 
  validateGoogleOAuthConfig,
  generateGoogleAuthURL,
  parseOAuthCallback
} from '@/utils/google-oauth-utils';

export const GoogleOAuthTest: React.FC = () => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const { data: session } = useSession();

  const config = getGoogleOAuthConfig();
  const validation = validateGoogleOAuthConfig();

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'skip', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setTestStatus('testing');
    setTestMessage('开始测试 Google OAuth 配置...');
    setTestResults([]);

    try {
      // 测试 1: 配置验证
      addTestResult(
        '配置验证', 
        validation.isValid ? 'pass' : 'fail',
        validation.isValid ? '配置有效' : validation.errors.join(', ')
      );

      // 测试 2: 环境变量检查
      const hasClientId = !!config.clientId && config.clientId !== 'demo_client_id';
      const hasClientSecret = !!config.clientSecret && config.clientSecret !== 'demo_client_secret';
      
      addTestResult(
        'Client ID 检查',
        hasClientId ? 'pass' : config.isDemoMode ? 'skip' : 'fail',
        hasClientId ? '已配置' : config.isDemoMode ? '演示模式' : '未配置'
      );

      addTestResult(
        'Client Secret 检查',
        hasClientSecret ? 'pass' : config.isDemoMode ? 'skip' : 'fail',
        hasClientSecret ? '已配置' : config.isDemoMode ? '演示模式' : '未配置'
      );

      // 测试 3: URL 生成
      if (!config.isDemoMode) {
        try {
          generateGoogleAuthURL(
            config.clientId,
            `${window.location.origin}/api/auth/callback/google`,
            'test-state'
          );

          addTestResult(
            'OAuth URL 生成',
            'pass',
            '成功生成授权 URL'
          );
        } catch (err) {
          addTestResult(
            'OAuth URL 生成',
            'fail',
            `生成失败: ${err}`
          );
        }
      } else {
        addTestResult(
          'OAuth URL 生成',
          'skip',
          '演示模式跳过'
        );
      }

      // 测试 4: Better Auth 客户端
      try {
        // 检查 signIn 函数是否可用
        if (typeof signIn?.social === 'function') {
          addTestResult(
            'Better Auth 客户端',
            'pass',
            'signIn.social 函数可用'
          );
        } else {
          addTestResult(
            'Better Auth 客户端',
            'fail',
            'signIn.social 函数不可用'
          );
        }
      } catch (err) {
        addTestResult(
          'Better Auth 客户端',
          'fail',
          `客户端错误: ${err}`
        );
      }

      // 测试 5: 会话状态
      addTestResult(
        '会话状态',
        session?.user ? 'pass' : 'skip',
        session?.user ? `已登录: ${session.user.email}` : '未登录'
      );

      // 测试 6: 回调 URL 解析
      try {
        const callback = parseOAuthCallback();
        addTestResult(
          '回调 URL 解析',
          'pass',
          callback.code ? '检测到授权码' : callback.error ? `检测到错误: ${callback.error}` : '无回调参数'
        );
      } catch (err) {
        addTestResult(
          '回调 URL 解析',
          'fail',
          `解析失败: ${err}`
        );
      }

      // 总结
      const passedTests = testResults.filter(r => r.status === 'pass').length;
      const failedTests = testResults.filter(r => r.status === 'fail').length;
      const skippedTests = testResults.filter(r => r.status === 'skip').length;

      if (failedTests === 0) {
        setTestStatus('success');
        setTestMessage(`测试完成！通过 ${passedTests} 项，跳过 ${skippedTests} 项`);
      } else {
        setTestStatus('error');
        setTestMessage(`测试完成！通过 ${passedTests} 项，失败 ${failedTests} 项，跳过 ${skippedTests} 项`);
      }

    } catch (err) {
      setTestStatus('error');
      setTestMessage(`测试过程中发生错误: ${err}`);
    }
  };

  const testGoogleLogin = async () => {
    if (config.isDemoMode) {
      setTestMessage('演示模式：模拟 Google 登录');
      return;
    }

    try {
      setTestMessage('正在启动 Google OAuth 流程...');
      
      await signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/`,
      });
      
      // 如果没有抛出错误，用户应该被重定向到 Google
      setTestMessage('已重定向到 Google 授权页面');
      
    } catch (err: any) {
      setTestMessage(`Google 登录测试失败: ${err.message}`);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'skip') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'skip':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Google OAuth 功能测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前状态 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                配置状态: {config.isConfigured ? '已配置' : config.isDemoMode ? '演示模式' : '未配置'}
              </div>
              <div className="text-sm text-gray-600">
                {config.isDemoMode ? '使用模拟的 Google 登录' : '使用真实的 Google OAuth'}
              </div>
            </div>
            
            {session?.user && (
              <div className="text-right">
                <div className="text-sm font-medium">已登录</div>
                <div className="text-xs text-gray-600">{session.user.email}</div>
              </div>
            )}
          </div>

          {/* 测试按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={runTests}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-2"
            >
              {testStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              运行配置测试
            </Button>

            <Button
              variant="outline"
              onClick={testGoogleLogin}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              测试 Google 登录
            </Button>
          </div>

          {/* 测试状态 */}
          {testMessage && (
            <Alert className={
              testStatus === 'success' ? 'border-green-200 bg-green-50' :
              testStatus === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }>
              <AlertDescription>{testMessage}</AlertDescription>
            </Alert>
          )}

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium">测试结果:</div>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}:</span>
                    <span className={
                      result.status === 'pass' ? 'text-green-700' :
                      result.status === 'fail' ? 'text-red-700' :
                      'text-yellow-700'
                    }>
                      {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 帮助信息 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">测试说明:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>配置测试会检查环境变量和 Better Auth 设置</li>
                  <li>Google 登录测试会启动真实的 OAuth 流程（如果已配置）</li>
                  <li>演示模式下会显示模拟的登录行为</li>
                  <li>如果测试失败，请检查 Google Cloud Console 配置</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};