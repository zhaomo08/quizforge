import { apiKeyUtils } from '@/utils/apiKeyUtils';

interface ResolveApiKeyOptions {
  userApiKey?: string;
  userId?: string;
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

export const resolveApiKey = ({
  userApiKey,
  userId,
  validate = (key: string) => typeof key === 'string' && key.trim().length >= 20,
  logger = () => {},
}: ResolveApiKeyOptions): string => {
  logger('🔑 API Key 获取流程开始...');
  logger('用户提供的 API Key', formatKeyForLog(userApiKey));
  logger('用户ID', userId || '无');
  logger('环境变量 API Key', formatKeyForLog((import.meta as any).env?.VITE_OPENROUTER_API_KEY));
  logger('项目内置 API Key', formatKeyForLog(PROJECT_API_KEY));

  if (userApiKey && validate(userApiKey)) {
    logger('✅ 使用用户提供的 API Key');
    return userApiKey;
  }

  if (userId) {
    const defaultApiKey = apiKeyUtils.getDefaultApiKey(userId);
    if (defaultApiKey) {
      const decryptedKey = apiKeyUtils.getDecryptedApiKey(defaultApiKey);
      logger('✅ 使用用户管理的 API Key', formatKeyForLog(decryptedKey));
      return decryptedKey;
    }
  }

  if (PROJECT_API_KEY && validate(PROJECT_API_KEY)) {
    logger('✅ 使用项目内置 API Key');
    return PROJECT_API_KEY;
  }

  logger('❌ 没有找到可用的 API Key');
  throw new Error('需要配置有效的 OpenRouter API Key。请到 https://openrouter.ai 注册获取免费 API Key，然后在 API Key 管理中添加');
};
