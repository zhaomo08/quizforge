import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  TestTube, 
  FileText, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { GoogleOAuthStatus } from './GoogleOAuthStatus';
import { GoogleOAuthTest } from './GoogleOAuthTest';
import { getGoogleOAuthConfig } from '@/utils/google-oauth-utils';

export const GoogleOAuthManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('status');
  const config = getGoogleOAuthConfig();

  const getStatusBadge = () => {
    if (config.isConfigured) {
      return <Badge variant="default" className="bg-green-100 text-green-800">已配置</Badge>;
    } else if (config.isDemoMode) {
      return <Badge variant="secondary">演示模式</Badge>;
    } else {
      return <Badge variant="destructive">未配置</Badge>;
    }
  };

  const openDocumentation = () => {
    window.open('/GOOGLE_OAUTH_COMPLETE_SETUP.md', '_blank');
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google OAuth 管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              配置和测试 Google 社交登录功能
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">快速操作</CardTitle>
          </CardHeader>
          <CardContent>
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
                onClick={openDocumentation}
                className="flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                设置文档
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('test')}
                className="flex items-center gap-1"
              >
                <TestTube className="h-3 w-3" />
                运行测试
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              配置状态
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              功能测试
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              设置指南
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            <GoogleOAuthStatus />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <GoogleOAuthTest />
          </TabsContent>

          <TabsContent value="guide" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Google OAuth 设置指南</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <h3>设置步骤概览</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium">创建 Google Cloud 项目</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          访问 Google Cloud Console，创建新项目或选择现有项目
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={openGoogleConsole}
                          className="p-0 h-auto text-blue-600"
                        >
                          打开 Google Cloud Console →
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">启用必要的 API</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          启用 Google+ API 或 People API
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">配置 OAuth 同意屏幕</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          设置应用名称、用户支持邮箱等信息
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">4</div>
                      <div>
                        <h4 className="font-medium">创建 OAuth 2.0 凭据</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          创建 Web 应用类型的 OAuth 客户端 ID
                        </p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div><strong>授权的 JavaScript 来源:</strong></div>
                          <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5173</code><br/>
                          <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5176</code>
                          
                          <div className="mt-2"><strong>授权的重定向 URI:</strong></div>
                          <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5173/api/auth/callback/google</code><br/>
                          <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5176/api/auth/callback/google</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">5</div>
                      <div>
                        <h4 className="font-medium">更新环境变量</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          在 .env 文件中设置获取到的客户端 ID 和密钥
                        </p>
                        <div className="mt-2 text-xs">
                          <code className="bg-gray-100 px-2 py-1 rounded block">
                            VITE_GOOGLE_CLIENT_ID=你的客户端ID<br/>
                            VITE_GOOGLE_CLIENT_SECRET=你的客户端密钥
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">6</div>
                      <div>
                        <h4 className="font-medium">重启开发服务器</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          重新启动应用以加载新的环境变量
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">重要提醒</h4>
                        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                          <li>• 确保重定向 URI 完全匹配，包括协议和端口</li>
                          <li>• 生产环境必须使用 HTTPS</li>
                          <li>• 不要在客户端代码中暴露客户端密钥</li>
                          <li>• 定期检查和更新 OAuth 凭据</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={openDocumentation}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    查看完整文档
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('test')}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    测试配置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};