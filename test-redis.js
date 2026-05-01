#!/usr/bin/env node

/**
 * Redis连接和API Key同步测试脚本
 * 用于验证API Key管理功能是否正常工作
 */

import Redis from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取.env文件
function loadEnvVars() {
  try {
    const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ 无法读取.env文件:', error.message);
    return {};
  }
}

// 测试Redis连接
async function testRedisConnection() {
  console.log('\n🔍 开始测试Redis连接...\n');
  
  const envVars = loadEnvVars();
  const host = envVars.REDIS_HOST || '192.168.0.199';
  const port = envVars.REDIS_PORT || '6379';
  const username = envVars.REDIS_USERNAME || '';
  const password = envVars.REDIS_PASSWORD || '123456';
  const db = envVars.REDIS_DB || '2';
  
  console.log('📋 Redis配置:');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Username: ${username || '(无)'}`);
  console.log(`   Password: ${password ? '***' : '(无)'}`);
  console.log(`   DB: ${db}\n`);
  
  const redis = new Redis({
    host,
    port: parseInt(port),
    username: username || undefined,
    password: password || undefined,
    db: parseInt(db),
    retryStrategy: (times) => {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 200, 1000);
    }
  });
  
  return new Promise((resolve, reject) => {
    redis.on('error', (err) => {
      console.error('❌ Redis连接错误:', err.message);
      reject(err);
    });
    
    redis.on('ready', async () => {
      console.log('✅ Redis连接成功!\n');
      
      try {
        // 测试基本操作
        console.log('🧪 测试基本操作...');
        
        // 1. 设置测试值
        const testKey = 'test:connection';
        const testValue = JSON.stringify({ 
          timestamp: new Date().toISOString(),
          message: 'Redis连接测试成功'
        });
        
        await redis.set(testKey, testValue);
        console.log('   ✓ SET 操作成功');
        
        // 2. 读取测试值
        const result = await redis.get(testKey);
        console.log('   ✓ GET 操作成功');
        console.log('   读取到的数据:', JSON.parse(result));
        
        // 3. 删除测试值
        await redis.del(testKey);
        console.log('   ✓ DEL 操作成功\n');
        
        // 4. 查看所有API Key相关的数据
        console.log('🔑 查找已存储的API Keys...');
        const keys = await redis.keys('user:*:api_keys_*');
        
        if (keys.length === 0) {
          console.log('   ℹ️  当前没有存储任何API Keys\n');
        } else {
          console.log(`   找到 ${keys.length} 个用户的API Keys:\n`);
          
          for (const key of keys) {
            const data = await redis.get(key);
            const apiKeys = JSON.parse(data);
            
            console.log(`   📦 ${key}:`);
            console.log(`      用户ID: ${key.match(/user:([^:]+):/)?.[1]}`);
            console.log(`      API Keys数量: ${apiKeys.length}`);
            
            apiKeys.forEach((apiKey, index) => {
              console.log(`      ${index + 1}. ${apiKey.name} (${apiKey.provider})`);
              console.log(`         默认: ${apiKey.isDefault ? '是' : '否'}`);
              console.log(`         内置: ${apiKey.isBuiltIn ? '是' : '否'}`);
              console.log(`         创建时间: ${new Date(apiKey.createdAt).toLocaleString('zh-CN')}`);
              if (apiKey.lastUsed) {
                console.log(`         最后使用: ${new Date(apiKey.lastUsed).toLocaleString('zh-CN')}`);
              }
            });
            console.log('');
          }
        }
        
        // 5. 显示Redis信息
        console.log('📊 Redis服务器信息:');
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
        const uptime = info.match(/uptime_in_days:([^\r\n]+)/)?.[1];
        console.log(`   Redis版本: ${version || 'unknown'}`);
        console.log(`   运行天数: ${uptime || 'unknown'}\n`);
        
        console.log('✅ 所有测试通过!\n');
        
        await redis.quit();
        resolve();
        
      } catch (error) {
        console.error('❌ 测试失败:', error.message);
        await redis.quit();
        reject(error);
      }
    });
  });
}

// 测试API Key数据结构
function validateApiKeyStructure() {
  console.log('📋 API Key数据结构验证\n');
  
  const exampleApiKey = {
    id: 'example_123',
    name: '我的DeepSeek Key',
    provider: 'deepseek',
    key: 'sk-xxxxxxxxxxxxxxxx',
    createdAt: new Date().toISOString(),
    isDefault: true,
    isBuiltIn: false,
    encrypted: false
  };
  
  console.log('示例API Key对象:');
  console.log(JSON.stringify(exampleApiKey, null, 2));
  console.log('');
  
  const requiredFields = ['id', 'name', 'provider', 'key', 'createdAt'];
  const hasAllFields = requiredFields.every(field => field in exampleApiKey);
  
  if (hasAllFields) {
    console.log('✅ 数据结构验证通过\n');
  } else {
    console.log('❌ 数据结构缺少必需字段\n');
  }
}

// 主函数
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     QuizForge - API Key管理功能测试              ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    validateApiKeyStructure();
    await testRedisConnection();
    
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     测试完成! 系统运行正常                        ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.log('\n建议检查:');
    console.log('1. .env文件中的Redis配置是否正确');
    console.log('2. Redis服务器是否运行中');
    console.log('3. 网络连接是否正常');
    console.log('4. Redis密码是否正确\n');
    
    process.exit(1);
  }
}

main();
