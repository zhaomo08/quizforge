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
    console.error('Failed to load .env file:', error);
    return {};
  }
}

import Redis from 'ioredis';

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;
  
  const envVars = loadEnvVars();
  // 使用配置，优先使用传入的环境变量或内置配置
  const host = envVars.REDIS_HOST || '192.168.0.199';
  const port = envVars.REDIS_PORT || '6379';
  const username = envVars.REDIS_USERNAME || '';
  const password = envVars.REDIS_PASSWORD || '123456';
  const db = envVars.REDIS_DB || '2';
  
  redisClient = new Redis({
    host,
    port: parseInt(port),
    username: username || undefined,
    password: password || undefined,
    db: parseInt(db),
  });
  
  redisClient.on('error', (err) => console.error('Redis Error:', err));
  return redisClient;
}

export function betterAuthPlugin() {
  return {
    name: 'better-auth',
    configureServer(server) {

      // ─── /api/storage/* 独立中间件 ──────────────────────────────────
      server.middlewares.use('/api/storage', async (req, res, next) => {
        try {
          const getSessionData = (req) => {
            const cookies = req.headers.cookie;
            if (cookies) {
              const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('auth-session='));
              if (sessionCookie) {
                try {
                  const sessionValue = sessionCookie.split('=').slice(1).join('=');
                  return JSON.parse(decodeURIComponent(sessionValue));
                } catch { return null; }
              }
            }
            return null;
          };

          const parseBody = (req) => new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try { resolve(body ? JSON.parse(body) : null); }
              catch { resolve(null); }
            });
          });

          const sessionData = getSessionData(req);
          if (!sessionData?.user?.id) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          const userId = sessionData.user.id;
          const redis = getRedisClient();

          // req.url 在 /api/storage 中间件内已去掉前缀，如 /interview_questions
          const storageKey = (req.url || '/').replace(/^\//, '').split('?')[0];
          if (!storageKey || !/^[a-zA-Z0-9_-]+$/.test(storageKey)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid storage key' }));
            return;
          }

          const redisKey = `user:${userId}:${storageKey}`;

          if (req.method === 'GET') {
            const data = await redis.get(redisKey);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data || 'null');
          } else if (req.method === 'POST') {
            const body = await parseBody(req);
            if (body !== null) {
              await redis.set(redisKey, JSON.stringify(body));
            } else {
              await redis.del(redisKey);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        } catch (error) {
          console.error('Storage API error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
        }
      });

      // ─── /api/auth/* 中间件（保留原有 Auth 逻辑，移除旧 storage 代码）──
      server.middlewares.use('/api/auth', async (req, res, next) => {
        try {
          console.log('Better Auth request:', req.method, req.url);
          
          // Helpers for session and body parsing
          const getSessionData = (req) => {
            const cookies = req.headers.cookie;
            if (cookies) {
              const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('auth-session='));
              if (sessionCookie) {
                try {
                  const sessionValue = sessionCookie.split('=')[1];
                  return JSON.parse(decodeURIComponent(sessionValue));
                } catch (error) {
                  return null;
                }
              }
            }
            return null;
          };

          const parseBody = (req) => {
            return new Promise((resolve, reject) => {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : null);
                } catch (e) {
                  resolve(null);
                }
              });
            });
          };

          // 简单的session端点处理
          if (req.url === '/session' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            
            // 检查是否有会话cookie
            const cookies = req.headers.cookie;
            if (cookies) {
              const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('auth-session='));
              if (sessionCookie) {
                try {
                  const sessionValue = sessionCookie.split('=')[1];
                  const sessionData = JSON.parse(decodeURIComponent(sessionValue));
                  res.end(JSON.stringify({ 
                    user: sessionData.user, 
                    session: { 
                      id: 'session-' + Date.now(),
                      userId: sessionData.user.id,
                      createdAt: sessionData.createdAt 
                    } 
                  }));
                  return;
                } catch (error) {
                  console.error('Session parse error:', error);
                }
              }
            }
            
            res.end(JSON.stringify({ user: null, session: null }));
            return;
          }
          
          // 简单的Google OAuth端点
          if (req.url.includes('/sign-in/google')) {
            const envVars = loadEnvVars();
            const clientId = envVars.GOOGLE_CLIENT_ID || envVars.VITE_GOOGLE_CLIENT_ID;
            console.log('Google Client ID:', clientId);
            
            if (!clientId || clientId === 'demo_client_id') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Google OAuth not configured' }));
              return;
            }
            
            const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
              `client_id=${encodeURIComponent(clientId)}&` +
              `redirect_uri=${encodeURIComponent('http://localhost:5173/api/auth/callback/google')}&` +
              `response_type=code&` +
              `scope=${encodeURIComponent('openid email profile')}&` +
              `access_type=offline&` +
              `prompt=consent`;
            
            res.statusCode = 302;
            res.setHeader('Location', redirectUrl);
            res.end();
            return;
          }
          
          // Google OAuth回调处理
          if (req.url.includes('/callback/google')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            
            if (error) {
              res.statusCode = 302;
              res.setHeader('Location', '/?error=' + encodeURIComponent(error));
              res.end();
              return;
            }
            
            if (code) {
              try {
                const envVars = loadEnvVars();
                const clientId = envVars.GOOGLE_CLIENT_ID || envVars.VITE_GOOGLE_CLIENT_ID;
                const clientSecret = envVars.GOOGLE_CLIENT_SECRET || envVars.VITE_GOOGLE_CLIENT_SECRET;
                
                // 用授权码换取访问令牌
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: 'http://localhost:5173/api/auth/callback/google',
                  }),
                });
                
                const tokenData = await tokenResponse.json();
                
                if (tokenData.access_token) {
                  // 获取用户信息
                  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                      'Authorization': `Bearer ${tokenData.access_token}`,
                    },
                  });
                  
                  const userData = await userResponse.json();
                  
                  // 创建一个简单的会话cookie
                  const sessionData = {
                    user: {
                      id: userData.id,
                      email: userData.email,
                      name: userData.name,
                      picture: userData.picture,
                    },
                    createdAt: new Date().toISOString(),
                  };
                  
                  // 设置会话cookie
                  res.setHeader('Set-Cookie', [
                    `auth-session=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
                  ]);
                  
                  res.statusCode = 302;
                  res.setHeader('Location', '/?login=success');
                  res.end();
                  return;
                } else {
                  throw new Error('Failed to get access token');
                }
              } catch (error) {
                console.error('OAuth callback error:', error);
                res.statusCode = 302;
                res.setHeader('Location', '/?error=oauth_failed');
                res.end();
                return;
              }
            }
          }
          
          // 退出登录端点
          if (req.url.includes('/sign-out')) {
            // 清除会话cookie
            res.setHeader('Set-Cookie', [
              'auth-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
            ]);
            res.statusCode = 302;
            res.setHeader('Location', '/?logout=success');
            res.end();
            return;
          }
          
          // 其他请求返回404
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Not found' }));
          
        } catch (error) {
          console.error('Better Auth error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
          }));
        }
      });
    }
  };
}