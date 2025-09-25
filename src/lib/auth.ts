// 开发模式下避免引入无关的适配器造成类型错误，保留客户端 auth-client 使用
// 如果后续接入真正的后端，可恢复 better-auth 服务端集成
import { betterAuth } from "better-auth";

// 获取Google OAuth配置
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET || '';

// 检查是否有真实的Google OAuth配置
const hasGoogleConfig = googleClientId && 
                       googleClientSecret && 
                       googleClientId !== 'demo_client_id' &&
                       googleClientSecret !== 'demo_client_secret';

if (import.meta.env.DEV) {
  // 开发环境可按需打开调试
  // console.log('Better Auth Config:', { hasGoogleConfig, clientIdLength: googleClientId?.length || 0, secretLength: googleClientSecret?.length || 0 });
}

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: hasGoogleConfig ? {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  } : {},
});

// 在当前使用方式下，仅向前端暴露轻量类型，避免构建受阻
export type Session = { user: any } | null;
export type User = { id: string; email?: string; name?: string; picture?: string };