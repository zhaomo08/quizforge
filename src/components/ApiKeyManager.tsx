import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { apiKeyUtils, type ApiKey } from '@/utils/apiKeyUtils';
import { Badge } from '@/components/ui/badge';

export const ApiKeyManager: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [newKey, setNewKey] = useState({
    name: '',
    provider: 'openai' as const,
    key: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // 初始化内置 API Key
      apiKeyUtils.initializeBuiltInApiKey(user.id);
      loadApiKeys();
    }
  }, [isAuthenticated, user]);

  const getStorageKey = () => {
    if (!user?.id) return null;
    return `api_keys_${user.id}`;
  };

  const loadApiKeys = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setApiKeys(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
  };

  const saveApiKeys = (keys: ApiKey[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    localStorage.setItem(storageKey, JSON.stringify(keys));
    setApiKeys(keys);
  };

  const addApiKey = () => {
    if (!newKey.name.trim() || !newKey.key.trim()) {
      setMessage({ type: 'error', text: '请填写完整的API Key信息' });
      return;
    }

    const apiKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKey.name.trim(),
      provider: newKey.provider,
      key: newKey.key.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedKeys = [...apiKeys, apiKey];
    saveApiKeys(updatedKeys);
    
    setNewKey({ name: '', provider: 'openai', key: '' });
    setMessage({ type: 'success', text: 'API Key添加成功' });
    
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteApiKey = (keyId: string) => {
    // 不允许删除内置 API Key
    const keyToDelete = apiKeys.find(key => key.id === keyId);
    if (keyToDelete?.isBuiltIn) {
      setMessage({ type: 'error', text: '不能删除项目内置的API Key' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const updatedKeys = apiKeys.filter(key => key.id !== keyId);
    saveApiKeys(updatedKeys);
    setMessage({ type: 'success', text: 'API Key删除成功' });
    setTimeout(() => setMessage(null), 3000);
  };

  const setAsDefault = (keyId: string) => {
    if (!user?.id) return;
    
    apiKeyUtils.setDefaultApiKey(user.id, keyId);
    loadApiKeys();
    setMessage({ type: 'success', text: '默认API Key设置成功' });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    // 内置 API Key 不允许查看
    const apiKey = apiKeys.find(key => key.id === keyId);
    if (apiKey?.isBuiltIn) {
      setMessage({ type: 'error', text: '项目内置API Key已加密，无法查看' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskApiKey = (apiKey: ApiKey) => {
    // 内置 API Key 不显示真实内容，只显示占位符
    if (apiKey.isBuiltIn) {
      return '••••••••••••••••••••••••••••••••••••••••••••••••••••';
    }
    
    const key = apiKey.key;
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'builtin':
        return { name: '项目内置', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
      case 'openai':
        return { name: 'OpenAI', color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'anthropic':
        return { name: 'Anthropic', color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'google':
        return { name: 'Google AI', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'custom':
        return { name: '自定义', color: 'text-purple-600', bgColor: 'bg-purple-50' };
      default:
        return { name: provider, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container layout-stable">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key 管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                请先登录Google账户以管理您的API Keys
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container layout-stable">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">API Key 管理</h1>
          <p className="text-gray-600 dark:text-gray-400">
            安全地管理您的大模型API Keys，支持多个提供商
          </p>
        </div>

        {/* Message */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              管理 API Keys
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加新 Key
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>已保存的 API Keys</CardTitle>
                <CardDescription>
                  您的API Keys安全存储在本地浏览器中，与您的Google账户关联。项目内置API Key为所有用户提供免费AI模型访问。
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      还没有保存任何API Keys
                    </p>
                    <Button onClick={() => (document.querySelector('[value="add"]') as HTMLElement | null)?.click()}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加第一个API Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => {
                      const providerInfo = getProviderInfo(apiKey.provider);
                      return (
                        <div
                          key={apiKey.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${providerInfo.color} ${providerInfo.bgColor}`}>
                                  {providerInfo.name}
                                </div>
                                <h3 className="font-medium">{apiKey.name}</h3>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                                  {showKeys[apiKey.id] && !apiKey.isBuiltIn ? apiKey.key : maskApiKey(apiKey)}
                                </code>
                                {!apiKey.isBuiltIn && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleKeyVisibility(apiKey.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {showKeys[apiKey.id] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {apiKey.isBuiltIn && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      加密
                                    </Badge>
                                    {apiKey.isDefault && (
                                      <Badge variant="default" className="text-xs">
                                        默认
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                创建时间: {new Date(apiKey.createdAt).toLocaleString()}
                                {apiKey.lastUsed && (
                                  <span className="ml-4">
                                    最后使用: {new Date(apiKey.lastUsed).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!apiKey.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAsDefault(apiKey.id)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              {!apiKey.isBuiltIn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteApiKey(apiKey.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>添加新的 API Key</CardTitle>
                <CardDescription>
                  添加您的大模型API Key以启用AI功能
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">名称</Label>
                  <Input
                    id="keyName"
                    placeholder="例如: 我的OpenAI Key"
                    value={newKey.name}
                    onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">提供商</Label>
                  <select
                    id="provider"
                    className="w-full p-2 border rounded-md bg-background"
                    value={newKey.provider}
                    onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value as any }))}
                  >
                    <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google AI (Gemini)</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={newKey.key}
                    onChange={(e) => setNewKey(prev => ({ ...prev, key: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    您的API Key将安全存储在本地浏览器中，不会上传到服务器
                  </p>
                </div>

                <Button onClick={addApiKey} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  保存 API Key
                </Button>
              </CardContent>
            </Card>

            {/* Provider Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  如何获取API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-green-600 mb-2">OpenAI</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      1. 访问 platform.openai.com<br/>
                      2. 登录并进入API Keys页面<br/>
                      3. 点击"Create new secret key"<br/>
                      4. 复制生成的key
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-orange-600 mb-2">Anthropic</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      1. 访问 console.anthropic.com<br/>
                      2. 登录并进入API Keys<br/>
                      3. 点击"Create Key"<br/>
                      4. 复制生成的key
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-blue-600 mb-2">Google AI</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      1. 访问 makersuite.google.com<br/>
                      2. 登录Google账户<br/>
                      3. 获取API Key<br/>
                      4. 复制生成的key
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-purple-600 mb-2">安全提醒</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      • 不要分享您的API Key<br/>
                      • 定期轮换API Key<br/>
                      • 监控API使用情况<br/>
                      • 设置使用限制
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};