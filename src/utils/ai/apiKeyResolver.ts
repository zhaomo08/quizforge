import { apiKeyUtils } from '@/utils/apiKeyUtils';

interface ResolveApiKeyOptions {
  userApiKey?: string;
  userId?: string;
  keyId?: string;   // 精确指定使用某个 key 的 ID
  validate?: (key: string) => boolean;
  logger?: (message: string, value?: unknown) => void;
}

const PROJECT_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';

const formatKeyForLog = (key?: string | null): string => {
  if (!key || typeof key !== 'string' || key.length < 4) {
    return '未设置';
  }
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
};

export const getProjectApiKey = (): string => {
  return PROJECT_API_KEY;
};

export interface ResolvedApiKey {
  key: string;
  provider: string;
  preferredModel?: string;  // 用户在 API Key 管理里选择的具体模型
}

export const resolveApiKey = ({
  userApiKey,
  userId,
  keyId,
  validate = (key: string) => typeof key === 'string' && key.trim().length >= 20,
  logger = () => {},
}: ResolveApiKeyOptions): ResolvedApiKey => {
  logger('🔑 API Key 获取流程开始...');
  logger('用户提供的 API Key', formatKeyForLog(userApiKey));
  logger('用户ID', userId || '无');
  logger('环境变量 API Key', formatKeyForLog((import.meta as any).env?.VITE_OPENROUTER_API_KEY));
  logger('项目内置 API Key', formatKeyForLog(PROJECT_API_KEY));

  // userApiKey is passed directly from settings in some components, assume default to 'custom' unless specified
  if (userApiKey && validate(userApiKey)) {
    logger('✅ 使用用户提供的 API Key');
    return { key: userApiKey, provider: 'custom' };
  }

  // 精确按 keyId 查找用户配置的某个 key
  if (keyId && userId) {
    const allKeys = apiKeyUtils.getUserApiKeys(userId);
    const found = allKeys.find(k => k.id === keyId);
    if (found) {
      const decryptedKey = apiKeyUtils.getDecryptedApiKey(found);
      logger('✅ 使用指定 keyId 的 API Key', formatKeyForLog(decryptedKey));
      return { key: decryptedKey, provider: found.provider, preferredModel: found.model };
    }
  }

  if (userId) {
    const defaultApiKey = apiKeyUtils.getDefaultApiKey(userId);
    if (defaultApiKey) {
      const decryptedKey = apiKeyUtils.getDecryptedApiKey(defaultApiKey);
      logger('✅ 使用用户管理的 API Key', formatKeyForLog(decryptedKey));
      return {
        key: decryptedKey,
        provider: defaultApiKey.provider,
        preferredModel: defaultApiKey.model,
      };
    }
  }

  if (PROJECT_API_KEY && validate(PROJECT_API_KEY)) {
    logger('✅ 使用项目内置 API Key');
    return { key: PROJECT_API_KEY, provider: 'builtin' };
  }

  logger('❌ 没有找到可用的 API Key');
  throw new Error('需要配置有效的 API Key。请在“API Key 管理”中添加');
};
