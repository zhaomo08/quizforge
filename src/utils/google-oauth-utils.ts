/**
 * Google OAuth 工具函数
 */

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
  isDemoMode: boolean;
}

/**
 * 检查 Google OAuth 配置状态
 */
import { env } from '@/lib/env';

export const getGoogleOAuthConfig = (): GoogleOAuthConfig => {
  const clientId = env.VITE_GOOGLE_CLIENT_ID || '';
  const clientSecret = env.VITE_GOOGLE_CLIENT_SECRET || '';
  
  const isDemoMode = clientId === 'demo_client_id' || 
                     clientId === '' || 
                     clientSecret === 'demo_client_secret' || 
                     clientSecret === '';
  
  const isConfigured = !isDemoMode && clientId.length > 0 && clientSecret.length > 0;
  
  return {
    clientId,
    clientSecret,
    isConfigured,
    isDemoMode
  };
};

/**
 * 验证 Google OAuth 配置
 */
export const validateGoogleOAuthConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const config = getGoogleOAuthConfig();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (config.isDemoMode) {
    warnings.push('当前使用演示模式，请配置真实的 Google OAuth 凭据');
  }
  
  if (!config.clientId || config.clientId === 'demo_client_id') {
    errors.push('缺少 Google Client ID');
  }
  
  if (!config.clientSecret || config.clientSecret === 'demo_client_secret') {
    errors.push('缺少 Google Client Secret');
  }
  
  // 检查 Client ID 格式
  if (config.clientId && config.clientId !== 'demo_client_id') {
    if (!config.clientId.includes('.googleusercontent.com')) {
      errors.push('Google Client ID 格式不正确');
    }
  }
  
  // 检查基础 URL 配置
  const baseURL = env.VITE_BETTER_AUTH_URL;
  if (!baseURL) {
    errors.push('缺少 VITE_BETTER_AUTH_URL 配置');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 生成 Google OAuth 授权 URL（用于调试）
 */
export const generateGoogleAuthURL = (
  clientId: string,
  redirectUri: string,
  state?: string
): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * 解析 OAuth 回调 URL 参数
 */
export const parseOAuthCallback = (url: string = window.location.href) => {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  return {
    code: params.get('code'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
    state: params.get('state'),
    scope: params.get('scope')
  };
};

/**
 * 获取 OAuth 错误的友好描述
 */
export const getOAuthErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    'access_denied': '用户拒绝了授权请求',
    'invalid_request': '请求参数无效',
    'unauthorized_client': '客户端未获得授权',
    'unsupported_response_type': '不支持的响应类型',
    'invalid_scope': '请求的权限范围无效',
    'server_error': 'Google 授权服务器遇到错误',
    'temporarily_unavailable': 'Google 授权服务暂时不可用',
    'invalid_client': '客户端认证失败',
    'invalid_grant': '授权码无效或已过期',
    'redirect_uri_mismatch': '重定向 URI 不匹配'
  };
  
  return errorMessages[error] || `未知错误: ${error}`;
};

/**
 * 检查当前环境是否支持 Google OAuth
 */
export const isGoogleOAuthSupported = (): boolean => {
  // 检查是否在安全上下文中（HTTPS 或 localhost）
  const isSecureContext = window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
  
  // 检查是否有必要的 API
  const hasRequiredAPIs = typeof window !== 'undefined' && 
                         typeof URLSearchParams !== 'undefined';
  
  return isSecureContext && hasRequiredAPIs;
};

/**
 * 调试信息收集
 */
export const collectDebugInfo = () => {
  const config = getGoogleOAuthConfig();
  const validation = validateGoogleOAuthConfig();
  const callback = parseOAuthCallback();
  
  return {
    timestamp: new Date().toISOString(),
    config: {
      ...config,
      clientSecret: config.clientSecret ? '[已设置]' : '[未设置]' // 不暴露密钥
    },
    validation,
    callback,
    environment: {
      url: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      isSecureContext: isGoogleOAuthSupported()
    },
    betterAuth: {
      baseURL: env.VITE_BETTER_AUTH_URL,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV
    }
  };
};