import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getGoogleOAuthConfig, 
  validateGoogleOAuthConfig, 
  collectDebugInfo,
  isGoogleOAuthSupported 
} from '@/utils/google-oauth-utils';

export const GoogleOAuthStatus: React.FC = () => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = getGoogleOAuthConfig();
  const validation = validateGoogleOAuthConfig();
  const debugInfo = collectDebugInfo();
  const isSupported = isGoogleOAuthSupported();

  const copyDebugInfo = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  const openSetupGuide = () => {
    window.open('/GOOGLE_OAUTH_COMPLETE_SETUP.md', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google OAuth 配置状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 整体状态 */}
          <div className="flex items-center gap-2">
            {config.isConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">
              {config.isConfigured ? '已配置' : config.isDemoMode ? '演示模式' : '未配置'}
            </span>
          </div>

          {/* 环境支持检查 */}
          <div className="flex items-center gap-2">
            {isSupported ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span>环境支持: {isSupported ? '支持' : '不支持'}</span>
          </div>

          {/* 配置详情 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Client ID:</span>
              <span className="font-mono text-sm">
                {showSecrets ? config.clientId : 
                 config.clientId ? `${config.clientId.substring(0, 20)}...` : '未设置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Client Secret:</span>
              <span className="font-mono text-sm">
                {showSecrets ? config.clientSecret : 
                 config.clientSecret ? '[已设置]' : '未设置'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
              className="h-6 px-2"
            >
              {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showSecrets ? '隐藏' : '显示'}
            </Button>
          </div>

          {/* 错误和警告 */}
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">配置错误:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    注意事项:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openGoogleConsole}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Google Console
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openSetupGuide}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              设置指南
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? '隐藏' : '显示'} 调试信息
            </Button>
          </div>

          {/* 调试信息 */}
          {showDebugInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">调试信息</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyDebugInfo}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速设置指南 */}
      {!config.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>快速设置 Google OAuth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">1</span>
                <div>
                  <div className="font-medium">创建 Google Cloud 项目</div>
                  <div className="text-gray-600">在 Google Cloud Console 中创建新项目</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">2</span>
                <div>
                  <div className="font-medium">配置 OAuth 2.0</div>
                  <div className="text-gray-600">创建 OAuth 客户端 ID 和密钥</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">3</span>
                <div>
                  <div className="font-medium">更新环境变量</div>
                  <div className="text-gray-600">在 .env 文件中设置 VITE_GOOGLE_CLIENT_ID 和 VITE_GOOGLE_CLIENT_SECRET</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">4</span>
                <div>
                  <div className="font-medium">重启开发服务器</div>
                  <div className="text-gray-600">重新启动应用以加载新的环境变量</div>
                </div>
              </div>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">重要提醒:</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>确保重定向 URI 设置为: <code className="bg-gray-100 px-1 rounded">http://localhost:5173/api/auth/callback/google</code></li>
                    <li>JavaScript 来源设置为: <code className="bg-gray-100 px-1 rounded">http://localhost:5173</code></li>
                    <li>生产环境需要使用 HTTPS 和真实域名</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};