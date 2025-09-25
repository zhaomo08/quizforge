#!/usr/bin/env node

/**
 * Google OAuth 配置测试脚本
 * 
 * 使用方法:
 * node test-google-oauth.js
 * 
 * 或者在 package.json 中添加脚本:
 * "test:oauth": "node test-google-oauth.js"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Google OAuth 配置检查\n');

// 检查 .env 文件
const envPath = path.join(process.cwd(), '.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  console.log('✅ 找到 .env 文件');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim();
    }
  });
} else {
  console.log('❌ 未找到 .env 文件');
  process.exit(1);
}

// 检查必要的环境变量
const requiredVars = [
  'VITE_BETTER_AUTH_URL',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_CLIENT_SECRET'
];

console.log('\n📋 环境变量检查:');
let hasErrors = false;

requiredVars.forEach(varName => {
  const value = envConfig[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: 未设置`);
    hasErrors = true;
  } else if (value === 'demo_client_id' || value === 'demo_client_secret') {
    console.log(`⚠️  ${varName}: ${value} (演示模式)`);
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

// 检查 Google Client ID 格式
const clientId = envConfig['VITE_GOOGLE_CLIENT_ID'];
if (clientId && clientId !== 'demo_client_id') {
  if (clientId.includes('.googleusercontent.com')) {
    console.log('✅ Google Client ID 格式正确');
  } else {
    console.log('❌ Google Client ID 格式不正确（应包含 .googleusercontent.com）');
    hasErrors = true;
  }
}

// 检查相关文件
console.log('\n📁 文件检查:');

const filesToCheck = [
  'src/lib/auth.ts',
  'src/lib/auth-client.ts',
  'src/components/auth/LoginForm.tsx',
  'src/utils/google-oauth-utils.ts',
  'GOOGLE_OAUTH_COMPLETE_SETUP.md'
];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath} (缺失)`);
    hasErrors = true;
  }
});

// 检查 package.json 依赖
console.log('\n📦 依赖检查:');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'better-auth'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: 未安装`);
      hasErrors = true;
    }
  });
}

// 生成配置建议
console.log('\n💡 配置建议:');

if (envConfig['VITE_GOOGLE_CLIENT_ID'] === 'demo_client_id') {
  console.log('1. 访问 https://console.cloud.google.com/apis/credentials');
  console.log('2. 创建 OAuth 2.0 客户端 ID');
  console.log('3. 设置重定向 URI: http://localhost:5173/api/auth/callback/google');
  console.log('4. 更新 .env 文件中的 VITE_GOOGLE_CLIENT_ID 和 VITE_GOOGLE_CLIENT_SECRET');
  console.log('5. 重启开发服务器');
}

// 生成测试 URL
const baseUrl = envConfig['VITE_BETTER_AUTH_URL'] || 'http://localhost:5173';
console.log('\n🔗 测试 URL:');
console.log(`应用地址: ${baseUrl}`);
console.log(`OAuth 管理: ${baseUrl}/#google-oauth`);
console.log(`回调地址: ${baseUrl}/api/auth/callback/google`);

// 总结
console.log('\n📊 检查总结:');
if (hasErrors) {
  console.log('❌ 发现配置问题，请根据上述建议进行修复');
  process.exit(1);
} else if (envConfig['VITE_GOOGLE_CLIENT_ID'] === 'demo_client_id') {
  console.log('⚠️  当前为演示模式，可以测试基本功能');
  console.log('💡 要启用真实的 Google OAuth，请按照上述建议配置');
} else {
  console.log('✅ 配置看起来正确！');
  console.log('🚀 可以开始测试 Google OAuth 功能');
}

console.log('\n🎯 下一步:');
console.log('1. 运行 npm run dev 启动开发服务器');
console.log('2. 访问应用并测试登录功能');
console.log('3. 查看开发工具 > Google OAuth 管理页面');
console.log('4. 如有问题，查看 GOOGLE_OAUTH_COMPLETE_SETUP.md 文档');