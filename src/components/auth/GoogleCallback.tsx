import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

interface GoogleCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleCallback: React.FC<GoogleCallbackProps> = ({
  onSuccess,
  onError
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理 Google 登录...');
  const { data: session } = useSession();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 检查 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          // Google 返回了错误
          let errorMessage = 'Google 登录失败';
          
          switch (error) {
            case 'access_denied':
              errorMessage = '用户拒绝了授权请求';
              break;
            case 'invalid_request':
              errorMessage = '无效的请求参数';
              break;
            case 'unauthorized_client':
              errorMessage = '客户端未授权';
              break;
            case 'unsupported_response_type':
              errorMessage = '不支持的响应类型';
              break;
            case 'invalid_scope':
              errorMessage = '无效的权限范围';
              break;
            case 'server_error':
              errorMessage = 'Google 服务器错误';
              break;
            case 'temporarily_unavailable':
              errorMessage = 'Google 服务暂时不可用';
              break;
            default:
              errorMessage = `Google 登录错误: ${error}`;
          }
          
          setStatus('error');
          setMessage(errorMessage);
          onError?.(errorMessage);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('未收到授权码');
          onError?.('未收到授权码');
          return;
        }

        // 等待 Better Auth 处理回调
        // Better Auth 会自动处理 OAuth 回调并设置会话
        
        // 检查会话状态
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkSession = () => {
          attempts++;
          
          if (session?.user) {
            setStatus('success');
            setMessage('Google 登录成功！');
            setTimeout(() => {
              onSuccess?.();
            }, 1500);
            return;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkSession, 500);
          } else {
            setStatus('error');
            setMessage('登录超时，请重试');
            onError?.('登录超时');
          }
        };
        
        // 开始检查会话
        setTimeout(checkSession, 1000);
        
      } catch (err: any) {
        console.error('Google 回调处理错误:', err);
        setStatus('error');
        setMessage('处理 Google 登录回调时发生错误');
        onError?.('处理回调时发生错误');
      }
    };

    handleCallback();
  }, [session, onSuccess, onError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && '处理中...'}
            {status === 'success' && '登录成功'}
            {status === 'error' && '登录失败'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                返回首页
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                如果问题持续存在，请检查 Google OAuth 配置
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};