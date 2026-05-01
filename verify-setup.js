#!/usr/bin/env node

/**
 * API Key管理功能验证清单
 * 自动检查所有必要的文件和配置
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  const result = {
    name,
    passed: condition,
    details
  };
  checks.push(result);
  
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

console.log('╔════════════════════════════════════════════════════╗');
console.log('║     API Key管理功能验证                           ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// 1. 检查必要文件
console.log('📁 检查必要文件...\n');

check(
  '工具函数文件存在',
  existsSync('src/utils/apiKeyUtils.ts'),
  '文件路径: src/utils/apiKeyUtils.ts'
);

check(
  'API Key管理组件存在',
  existsSync('src/components/ApiKeyManager.tsx'),
  '文件路径: src/components/ApiKeyManager.tsx'
);

check(
  '存储工具文件存在',
  existsSync('src/utils/storage.ts'),
  '文件路径: src/utils/storage.ts'
);

check(
  'Vite插件文件存在',
  existsSync('vite-auth-plugin.js'),
  '文件路径: vite-auth-plugin.js'
);

check(
  '认证Provider存在',
  existsSync('src/components/auth/AuthProvider.tsx'),
  '文件路径: src/components/auth/AuthProvider.tsx'
);

// 2. 检查环境配置
console.log('\n⚙️  检查环境配置...\n');

let envVars = {};
try {
  const envContent = readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...value] = trimmed.split('=');
      if (key) envVars[key.trim()] = value.join('=').trim();
    }
  });
} catch (e) {
  // .env文件不存在
}

check(
  'Google OAuth Client ID已配置',
  !!(envVars.GOOGLE_CLIENT_ID || envVars.VITE_GOOGLE_CLIENT_ID),
  '在.env文件中配置GOOGLE_CLIENT_ID'
);

check(
  'Google OAuth Secret已配置',
  !!(envVars.GOOGLE_CLIENT_SECRET || envVars.VITE_GOOGLE_CLIENT_SECRET),
  '在.env文件中配置GOOGLE_CLIENT_SECRET'
);

check(
  'Redis配置存在',
  !!(envVars.REDIS_HOST && envVars.REDIS_PORT),
  '在.env文件中配置Redis连接信息'
);

// 3. 检查代码实现
console.log('\n🔧 检查代码实现...\n');

try {
  const apiKeyUtilsContent = readFileSync('src/utils/apiKeyUtils.ts', 'utf8');
  
  check(
    'DeepSeek支持已实现',
    apiKeyUtilsContent.includes("'deepseek'"),
    '提供商: deepseek'
  );
  
  check(
    'Kimi(月之暗面)支持已实现',
    apiKeyUtilsContent.includes("'kimi'"),
    '提供商: kimi (Moonshot AI)'
  );
  
  check(
    'Qwen(阿里百炼)支持已实现',
    apiKeyUtilsContent.includes("'qwen'"),
    '提供商: qwen (通义千问)'
  );
  
  check(
    'API配置创建函数存在',
    apiKeyUtilsContent.includes('createApiConfig'),
    '函数: createApiConfig'
  );
  
  check(
    'API Key验证函数存在',
    apiKeyUtilsContent.includes('validateApiKey'),
    '函数: validateApiKey'
  );
  
  check(
    '默认Key获取函数存在',
    apiKeyUtilsContent.includes('getDefaultApiKey'),
    '函数: getDefaultApiKey'
  );
} catch (e) {
  console.log('❌ 无法读取apiKeyUtils.ts文件');
  failed++;
}

try {
  const storageContent = readFileSync('src/utils/storage.ts', 'utf8');
  
  check(
    'Redis同步函数存在',
    storageContent.includes('syncToServer'),
    '函数: syncToServer'
  );
  
  check(
    '服务器数据加载函数存在',
    storageContent.includes('loadAllFromServer'),
    '函数: loadAllFromServer'
  );
} catch (e) {
  console.log('❌ 无法读取storage.ts文件');
  failed++;
}

try {
  const pluginContent = readFileSync('vite-auth-plugin.js', 'utf8');
  
  check(
    'Redis客户端已配置',
    pluginContent.includes('Redis') && pluginContent.includes('ioredis'),
    '使用ioredis库'
  );
  
  check(
    'Storage API端点已实现',
    pluginContent.includes('/api/storage'),
    '端点: /api/storage/*'
  );
  
  check(
    '会话验证已实现',
    pluginContent.includes('auth-session'),
    'Cookie: auth-session'
  );
} catch (e) {
  console.log('❌ 无法读取vite-auth-plugin.js文件');
  failed++;
}

// 4. 检查依赖
console.log('\n📦 检查依赖...\n');

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  check(
    'ioredis依赖已安装',
    !!(packageJson.dependencies?.ioredis),
    '版本: ' + (packageJson.dependencies?.ioredis || 'N/A')
  );
  
  check(
    'better-auth依赖已安装',
    !!(packageJson.dependencies?.['better-auth']),
    '版本: ' + (packageJson.dependencies?.['better-auth'] || 'N/A')
  );
  
  check(
    'React依赖已安装',
    !!(packageJson.dependencies?.react),
    '版本: ' + (packageJson.dependencies?.react || 'N/A')
  );
} catch (e) {
  console.log('❌ 无法读取package.json文件');
  failed++;
}

// 5. 检查文档
console.log('\n📚 检查文档...\n');

check(
  'API Key使用指南存在',
  existsSync('API_KEY_GUIDE.md'),
  '文件: API_KEY_GUIDE.md'
);

check(
  'API Key使用示例存在',
  existsSync('API_KEY_USAGE_EXAMPLES.md'),
  '文件: API_KEY_USAGE_EXAMPLES.md'
);

check(
  'Redis测试脚本存在',
  existsSync('test-redis.js'),
  '文件: test-redis.js'
);

// 总结
console.log('\n' + '═'.repeat(52));
console.log('📊 验证结果:');
console.log('═'.repeat(52));
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);
console.log(`📝 总计: ${checks.length}`);
console.log('═'.repeat(52) + '\n');

if (failed === 0) {
  console.log('🎉 恭喜! 所有检查都通过了!\n');
  console.log('接下来的步骤:');
  console.log('1. 运行 npm run dev 启动开发服务器');
  console.log('2. 访问 http://localhost:5173');
  console.log('3. 使用Google账户登录');
  console.log('4. 访问API Key管理页面添加你的密钥\n');
  console.log('测试Redis连接: npm run test:redis\n');
  process.exit(0);
} else {
  console.log('⚠️  有 ' + failed + ' 项检查失败，请修复后再继续。\n');
  console.log('需要帮助? 查看文档:');
  console.log('- API_KEY_GUIDE.md');
  console.log('- API_KEY_USAGE_EXAMPLES.md\n');
  process.exit(1);
}
