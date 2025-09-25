import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

// 检查是否为演示模式
const isDemoMode = process.env.VITE_GOOGLE_CLIENT_ID === 'demo_client_id' || 
                   !process.env.VITE_GOOGLE_CLIENT_ID ||
                   process.env.VITE_GOOGLE_CLIENT_ID === '';

// 获取环境变量，提供默认值
const getEnvVar = (key: string, defaultValue: string = "") => {
  if (typeof window !== 'undefined') {
    return (window as any).__ENV__?.[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

export const auth = betterAuth({
  database: memoryAdapter(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 开发环境暂时关闭邮箱验证
  },
  socialProviders: isDemoMode ? {} : {
    google: {
      clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
      clientSecret: getEnvVar('VITE_GOOGLE_CLIENT_SECRET'),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  baseURL: getEnvVar('VITE_BETTER_AUTH_URL', 'http://localhost:5173'),
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;