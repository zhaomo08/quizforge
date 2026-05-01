import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { type ApiKey } from '@/utils/apiKeyUtils';
import { syncToServer } from '@/utils/storage';
import { BackButton } from '@/components/BackButton';

// openrouter/free 路由器，自动选择可用的免费模型
const FREE_MODEL_ID = 'openrouter/free';

const PROVIDERS = [
  {
    id: 'custom' as const,
    name: 'OpenRouter（自定义）',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950',
    placeholder: 'sk-or-v1-...',
    modelPlaceholder: 'openrouter/free',
    modelHint: '例：openrouter/free（随机免费）/ deepseek/deepseek-chat-v3-0324:free',
    guide: {
      url: 'https://openrouter.ai/keys',
      steps: ['访问 openrouter.ai/keys', '注册并登录 OpenRouter', '点击「Create Key」', '复制生成的 sk-or-v1- 开头的 key'],
    },
  },
  {
    id: 'deepseek' as const,
    name: 'DeepSeek',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    placeholder: 'sk-...',
    modelPlaceholder: 'deepseek-chat',
    modelHint: '例：deepseek-chat / deepseek-reasoner',
    guide: {
      url: 'https://platform.deepseek.com',
      steps: ['访问 platform.deepseek.com', '注册并登录开发者平台', '进入「API keys」创建 Key', '复制生成的 key'],
    },
  },
  {
    id: 'qwen' as const,
    name: '通义千问',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
    placeholder: 'sk-...',
    modelPlaceholder: 'qwen-plus',
    modelHint: '例：qwen-max / qwen-plus / qwen-turbo',
    guide: {
      url: 'https://dashscope.aliyun.com',
      steps: ['访问 dashscope.aliyun.com', '登录阿里云百炼平台', '点击「API-KEY 管理」', '复制生成的 key'],
    },
  },
  {
    id: 'kimi' as const,
    name: 'Kimi (Moonshot)',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    placeholder: 'sk-...',
    modelPlaceholder: 'moonshot-v1-8k',
    modelHint: '例：moonshot-v1-8k / moonshot-v1-32k',
    guide: {
      url: 'https://platform.moonshot.cn',
      steps: ['访问 platform.moonshot.cn', '登录月之暗面开放平台', '进入「API Key 管理」', '复制生成的 key'],
    },
  },
];

export const ApiKeyManager: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState<{ name: string; provider: 'custom' | 'deepseek' | 'qwen' | 'kimi'; key: string; model: string }>({ name: '', provider: 'custom', key: '', model: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) loadApiKeys();
  }, [isAuthenticated, user]);

  const storageKey = user ? `api_keys_${user.id}` : null;

  const loadApiKeys = () => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setApiKeys((JSON.parse(stored) as ApiKey[]).filter(k => !k.isBuiltIn));
    } catch {}
  };

  const persist = (keys: ApiKey[]) => {
    if (!storageKey) return;
    const all: ApiKey[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const builtIns = all.filter(k => k.isBuiltIn);
    const updated = [...builtIns, ...keys];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    syncToServer(storageKey, updated);
    setApiKeys(keys);
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const addApiKey = () => {
    if (!newKey.name.trim() || !newKey.key.trim()) {
      showMsg('error', '请填写名称和 API Key');
      return;
    }
    const entry: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKey.name.trim(),
      provider: newKey.provider,
      key: newKey.key.trim(),
      model: newKey.model || undefined,
      createdAt: new Date().toISOString(),
      isDefault: apiKeys.length === 0,
    };
    persist([...apiKeys, entry]);
    setNewKey({ name: '', provider: 'custom', key: '', model: '' });
    setIsAdding(false);
    showMsg('success', 'API Key 添加成功');
  };

  const deleteApiKey = (id: string) => {
    persist(apiKeys.filter(k => k.id !== id));
    showMsg('success', '已删除');
  };

  const setDefault = (id: string) => {
    persist(apiKeys.map(k => ({ ...k, isDefault: k.id === id })));
    showMsg('success', '已设为默认');
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.slice(0, 6) + '•'.repeat(Math.min(key.length - 10, 20)) + key.slice(-4);
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container layout-stable">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">请先登录以管理 API Keys</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container layout-stable">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold mt-4 mb-1">API Key 管理</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">管理您的 AI 模型密钥，密钥加密存储在您的账户中</p>
        </div>

        {/* Toast */}
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}>
            {message.type === 'success'
              ? <CheckCircle className="h-4 w-4 text-green-600" />
              : <AlertCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Free models banner */}
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">系统免费模型（登录即用）</h3>
                  <Badge className="bg-emerald-600 text-white text-xs">无需配置</Badge>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                  登录后直接通过 <code className="bg-emerald-100 dark:bg-emerald-900 px-1 rounded text-xs font-mono">{FREE_MODEL_ID}</code> 路由器生成题目，OpenRouter 会自动选择当前可用的免费模型：
                </p>
                <span className="inline-flex items-center gap-1 text-xs bg-white dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  openrouter/free（自动路由到任意可用免费模型）
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My keys */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                我的 API Keys
                {apiKeys.length > 0 && (
                  <Badge variant="secondary">{apiKeys.length}</Badge>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 && !isAdding ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">还没有添加自己的 API Key</p>
                <p className="text-xs mt-1 text-gray-400">添加后将优先使用您的 Key</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(k => {
                  const provider = PROVIDERS.find(p => p.id === k.provider);
                  const modelName = k.model || provider?.modelPlaceholder || '';
                  return (
                    <div key={k.id} className={`border rounded-lg p-4 ${k.isDefault ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${provider?.color ?? 'text-gray-600'} ${provider?.bg ?? 'bg-gray-100'}`}>
                              {provider?.name ?? k.provider}
                            </span>
                            <span className="font-medium text-sm truncate">{k.name}</span>
                            {k.isDefault && <Badge className="text-xs bg-blue-600">默认</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {showKeys[k.id] ? k.key : maskKey(k.key)}
                            </code>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => setShowKeys(prev => ({ ...prev, [k.id]: !prev[k.id] }))}>
                              {showKeys[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            模型：<span className="text-gray-600 dark:text-gray-300">{modelName}</span>
                            <span className="mx-2">·</span>
                            创建于 {new Date(k.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!k.isDefault && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                              title="设为默认" onClick={() => setDefault(k.id)}>
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => deleteApiKey(k.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline add form */}
            {isAdding && (
              <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
                <h4 className="font-medium text-sm">添加新的 API Key</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">名称</Label>
                    <Input placeholder="例如：我的 DeepSeek Key" value={newKey.name}
                      onChange={e => setNewKey(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">提供商</Label>
                    <select className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                      value={newKey.provider}
                      onChange={e => setNewKey(p => ({ ...p, provider: e.target.value as any, model: '' }))}>
                      {PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">使用模型（可选）</Label>
                    <Input
                      placeholder={PROVIDERS.find(p => p.id === newKey.provider)?.modelPlaceholder ?? 'deepseek-chat'}
                      value={newKey.model}
                      onChange={e => setNewKey(p => ({ ...p, model: e.target.value }))}
                    />
                    <p className="text-xs text-gray-400">
                      {PROVIDERS.find(p => p.id === newKey.provider)?.modelHint}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <Input type="password"
                      placeholder={PROVIDERS.find(p => p.id === newKey.provider)?.placeholder ?? 'sk-...'}
                      value={newKey.key}
                      onChange={e => setNewKey(p => ({ ...p, key: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addApiKey()} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewKey({ name: '', provider: 'custom', key: '', model: '' }); }}>
                    取消
                  </Button>
                  <Button size="sm" onClick={addApiKey}>保存</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security note */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-medium">安全提醒</p>
                <p className="text-xs">您的 Key 加密存储在服务器中并与账号绑定 · 不同设备登录后自动同步 · 请勿分享您的 Key · 请定期检查 API 用量</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to get guide */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">如何获取 API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {PROVIDERS.map(p => (
                <div key={p.id} className={`rounded-lg p-4 ${p.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${p.color}`}>{p.name}</h4>
                    <a href={p.guide.url} target="_blank" rel="noopener noreferrer"
                      className={`${p.color} hover:underline`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <ol className="space-y-1">
                    {p.guide.steps.map((step, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex gap-1.5">
                        <span className={`font-bold ${p.color} flex-shrink-0`}>{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
