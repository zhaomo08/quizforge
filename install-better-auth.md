# Better Auth 安装指南

## 1. 安装依赖

```bash
npm install better-auth @better-auth/react
```

## 2. 安装 Google OAuth 插件

```bash
npm install @better-auth/google
```

## 3. 环境变量设置

在项目根目录创建 `.env` 文件：

```env
# Better Auth 配置
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. Google OAuth 设置步骤

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 设置授权重定向 URI: `http://localhost:5173/api/auth/callback/google`
6. 复制客户端 ID 和密钥到 .env 文件

请先运行安装命令，然后我会继续配置代码。