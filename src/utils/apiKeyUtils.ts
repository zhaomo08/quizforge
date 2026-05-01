import { syncToServer } from './storage';

interface ApiKey {
  id: string;
  name: string;
  provider: 'deepseek' | 'qwen' | 'kimi' | 'builtin' | 'custom';
  key: string;
  model?: string;  // 用户指定的具体模型 ID
  createdAt: string;
  lastUsed?: string;
  isDefault?: boolean;
  isBuiltIn?: boolean;
  encrypted?: boolean;
}

// 简单的加密/解密函数（用于内置 API Key）
const simpleEncrypt = (text: string): string => {
  return btoa(text.split('').reverse().join(''));
};

const simpleDecrypt = (encrypted: string): string => {
  try {
    return atob(encrypted).split('').reverse().join('');
  } catch {
    return '';
  }
};

export const apiKeyUtils = {
  // 获取项目内置 API Key
  getBuiltInApiKey: (): string => {
    const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
    
    // 检测示例密钥，如果是示例密钥则返回空字符串
    if (envKey.includes('demo-key') || envKey.includes('replace-with-real') || envKey.includes('your_openrouter_api_key_here')) {
      return '';
    }
    
    return envKey;
  },

  // 初始化用户的内置 API Key（登录时调用）
  initializeBuiltInApiKey: (userId: string): void => {
    const builtInKey = apiKeyUtils.getBuiltInApiKey();
    if (!builtInKey) return;

    const storageKey = `api_keys_${userId}`;
    // 读取后先做一次去重，避免历史版本重复写入
    const rawKeys = apiKeyUtils.getUserApiKeys(userId);
    const dedupedById = new Map<string, ApiKey>();
    for (const k of rawKeys) {
      // 同一 id 以最新 createdAt 为准
      const prev = dedupedById.get(k.id);
      if (!prev || new Date(prev.createdAt) < new Date(k.createdAt)) {
        dedupedById.set(k.id, k);
      }
    }
    // 再按 (provider,name,isBuiltIn) 去重（避免相同内置项被多次插入不同 id）
    const keys = Array.from(dedupedById.values());
    const unique: ApiKey[] = [];
    const seen = new Set<string>();
    for (const k of keys) {
      const sig = `${k.provider}|${k.name}|${k.isBuiltIn ? '1' : '0'}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        unique.push(k);
      }
    }

    const existingBuiltIn = unique.find(k => k.isBuiltIn);

    // 如果已经存在内置 key，但与当前环境中的内置 key 不同，则覆盖更新
    if (existingBuiltIn) {
      try {
        const decrypted = existingBuiltIn.encrypted ? simpleDecrypt(existingBuiltIn.key) : existingBuiltIn.key;
        if (decrypted !== builtInKey) {
          const encryptedKey = simpleEncrypt(builtInKey);
          const updatedKeys = unique.map(k =>
            k.id === existingBuiltIn.id
              ? { ...k, key: encryptedKey, encrypted: true, createdAt: new Date().toISOString() }
              : k
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
          syncToServer(storageKey, updatedKeys);
          return;
        }
      } catch (e) {
        // 如果解密失败，则覆盖为新的内置 key
        const encryptedKey = simpleEncrypt(builtInKey);
        const updatedKeys = unique.map(k =>
          k.id === existingBuiltIn.id
            ? { ...k, key: encryptedKey, encrypted: true, createdAt: new Date().toISOString() }
            : k
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
        syncToServer(storageKey, updatedKeys);
        return;
      }
    }

    // 如果不存在内置 key，则添加
    const encryptedKey = simpleEncrypt(builtInKey);
    const builtInApiKey: ApiKey = {
      id: 'builtin_default',
      name: '项目内置免费模型',
      provider: 'builtin',
      key: encryptedKey,
      createdAt: new Date().toISOString(),
      isDefault: true,
      isBuiltIn: true,
      encrypted: true
    };

    // 若 unique 中已存在任意 isBuiltIn 的条目，则不再追加，保证幂等
    if (unique.some(k => k.isBuiltIn)) {
      localStorage.setItem(storageKey, JSON.stringify(unique));
      syncToServer(storageKey, unique);
      return;
    }

    const updatedKeys = [builtInApiKey, ...unique];
    localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
    syncToServer(storageKey, updatedKeys);
  },

  // 获取用户的API Keys
  getUserApiKeys: (userId: string): ApiKey[] => {
    const storageKey = `api_keys_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse API keys:', error);
        return [];
      }
    }
    
    return [];
  },

  // 根据提供商获取API Key
  getApiKeyByProvider: (userId: string, provider: string): ApiKey | null => {
    const apiKeys = apiKeyUtils.getUserApiKeys(userId);
    return apiKeys.find(key => key.provider === provider) || null;
  },

  // 获取默认API Key（优先返回标记为默认的，否则返回第一个）
  getDefaultApiKey: (userId: string): ApiKey | null => {
    const apiKeys = apiKeyUtils.getUserApiKeys(userId);
    const defaultKey = apiKeys.find(key => key.isDefault);
    return defaultKey ?? apiKeys[0] ?? null;
  },

  // 获取解密后的 API Key
  getDecryptedApiKey: (apiKey: ApiKey): string => {
    if (apiKey.encrypted && apiKey.isBuiltIn) {
      return simpleDecrypt(apiKey.key);
    }
    return apiKey.key;
  },

  // 更新API Key的最后使用时间
  updateLastUsed: (userId: string, keyId: string): void => {
    const apiKeys = apiKeyUtils.getUserApiKeys(userId);
    const updatedKeys = apiKeys.map(key => 
      key.id === keyId 
        ? { ...key, lastUsed: new Date().toISOString() }
        : key
    );
    
    const storageKey = `api_keys_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
    syncToServer(storageKey, updatedKeys);
  },

  // 检查用户是否有可用的API Key
  hasApiKey: (userId: string): boolean => {
    const apiKeys = apiKeyUtils.getUserApiKeys(userId);
    return apiKeys.length > 0;
  },

  // 设置默认 API Key
  setDefaultApiKey: (userId: string, keyId: string): void => {
    const apiKeys = apiKeyUtils.getUserApiKeys(userId);
    const updatedKeys = apiKeys.map(key => ({
      ...key,
      isDefault: key.id === keyId
    }));
    
    const storageKey = `api_keys_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
    syncToServer(storageKey, updatedKeys);
  },

  // 获取支持的提供商列表
  getSupportedProviders: () => [
    { id: 'builtin', name: '项目内置', models: ['DeepSeek V3.1', 'Gemini 2.0 Flash', 'Kimi K2', 'Mistral Small', 'GPT-OSS-120B'] },
    { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
    { id: 'qwen', name: '通义千问', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
    { id: 'kimi', name: 'Kimi', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
    { id: 'custom', name: '自定义', models: [] }
  ],

  // 验证API Key格式
  validateApiKey: (provider: string, key: string): boolean => {
    if (!key || key.trim().length === 0) return false;
    
    switch (provider) {
      case 'builtin':
        return true; // 内置 API Key 总是有效
      case 'deepseek':
      case 'qwen':
      case 'kimi':
        return key.startsWith('sk-') && key.length > 20;
      case 'custom':
        return key.length > 5; // Minimal validation for custom keys
      default:
        return false;
    }
  },

  // 创建API请求配置
  createApiConfig: (apiKey: ApiKey) => {
    const baseConfigs = {
      builtin: {
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          'Authorization': `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json'
        }
      },
      deepseek: {
        baseURL: 'https://api.deepseek.com/v1',
        headers: {
          'Authorization': `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json'
        }
      },
      qwen: {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        headers: {
          'Authorization': `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json'
        }
      },
      kimi: {
        baseURL: 'https://api.moonshot.cn/v1',
        headers: {
          'Authorization': `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json'
        }
      },
      custom: {
        headers: {
          'Authorization': `Bearer ${apiKey.key}`,
          'Content-Type': 'application/json'
        }
      }
    };

    return baseConfigs[apiKey.provider as keyof typeof baseConfigs] || baseConfigs.custom;
  },

  // 测试API Key是否有效
  testApiKey: async (apiKey: ApiKey): Promise<{ valid: boolean; error?: string }> => {
    try {
      const config = apiKeyUtils.createApiConfig(apiKey);
      
      // 根据不同提供商进行测试请求
      switch (apiKey.provider) {
        case 'builtin':
        case 'deepseek':
        case 'qwen':
        case 'kimi':
          const openaiResponse = await fetch(`${(config as any).baseURL}/models`, {
            headers: (config as any).headers
          });
          return { valid: openaiResponse.ok };
          
        default:
          return { valid: true }; // Assume custom keys are valid
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
};

export type { ApiKey };