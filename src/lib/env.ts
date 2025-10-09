import { z } from 'zod';

// 定义环境变量 schema（仅列出需要用到的变量）
const origin = (typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:5173');

const EnvSchema = z.object({
  // 改为可选并在运行时提供 fallback，降低本地启动门槛
  VITE_API_BASE_URL: z.string().url().optional().describe('后端 API 基础地址'),
  VITE_BETTER_AUTH_URL: z.string().url().optional().describe('Better Auth 服务地址'),
  VITE_AI_API_BASE: z.string().url().optional(),
  VITE_AI_MODEL: z.string().optional(),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_GOOGLE_CLIENT_SECRET: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false').optional(),
  VITE_ENABLE_GOOGLE_OAUTH: z.enum(['true', 'false']).default('true').optional(),
  VITE_ENABLE_EXPERIMENTAL_UI: z.enum(['true', 'false']).default('false').optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  VITE_APP_BUILD_TIME: z.string().optional(),
});

// 解析并缓存
let cachedEnv: ReturnType<typeof loadEnv> | null = null;

function loadEnv() {
  const parsed = EnvSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    if (firstError) {
      console.error('[env] 环境变量校验失败:', firstError.path.join('.'), firstError.message);
    } else {
      console.error('[env] 环境变量校验失败: 未知错误');
    }
    // 不再直接抛出，继续使用 fallback 以便开发体验
    // throw new Error('环境变量不完整或格式错误，请检查 .env 配置');
    // 提供一个最小对象，避免后续访问崩溃
    return {
      VITE_API_BASE_URL: origin + '/api',
      VITE_BETTER_AUTH_URL: origin + '/auth',
    } as any;
  }
  const data = parsed.data;
  return {
    ...data,
    VITE_API_BASE_URL: data.VITE_API_BASE_URL || (origin + '/api'),
    VITE_BETTER_AUTH_URL: data.VITE_BETTER_AUTH_URL || (origin + '/auth'),
  };
}

export const env = new Proxy({}, {
  get(_target, prop: string) {
    if (!cachedEnv) cachedEnv = loadEnv();
    return (cachedEnv as any)[prop];
  }
}) as unknown as z.infer<typeof EnvSchema>;

// 帮助函数：布尔解析
export function flag(v: string | undefined) {
  return v === 'true';
}
