// 开发模式下避免引入无关的适配器造成类型错误，保留客户端 auth-client 使用
// 如果后续接入真正的后端，可恢复 better-auth 服务端集成
import { betterAuth } from "better-auth";

// 获取Google OAuth配置
// 使用索引访问以兼容 noPropertyAccessFromIndexSignature
const googleClientId = (process.env && (process.env as any)["GOOGLE_CLIENT_ID"]) || (process.env && (process.env as any)["VITE_GOOGLE_CLIENT_ID"]) || '';
const googleClientSecret = (process.env && (process.env as any)["GOOGLE_CLIENT_SECRET"]) || (process.env && (process.env as any)["VITE_GOOGLE_CLIENT_SECRET"]) || '';

// 检查是否有真实的Google OAuth配置
const hasGoogleConfig = googleClientId && 
                       googleClientSecret && 
                       googleClientId !== 'demo_client_id' &&
                       googleClientSecret !== 'demo_client_secret';

// 避免在 Node (Vite 配置阶段) 访问 import.meta.env 导致报错，调试输出可按需开启
// const isDev = (process && process.env && (process.env as any)["NODE_ENV"] !== 'production');
// if (isDev) {
//   console.log('[auth] Google config present:', !!hasGoogleConfig);
// }

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