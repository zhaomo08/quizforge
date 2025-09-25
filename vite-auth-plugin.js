import { auth } from './src/lib/auth.js';

export function betterAuthPlugin() {
  return {
    name: 'better-auth',
    configureServer(server) {
      server.middlewares.use('/api/auth', async (req, res, next) => {
        try {
          const response = await auth.handler(req);
          
          if (response) {
            res.statusCode = response.status || 200;
            
            // 设置响应头
            if (response.headers) {
              for (const [key, value] of Object.entries(response.headers)) {
                res.setHeader(key, value);
              }
            }
            
            // 发送响应体
            if (response.body) {
              if (typeof response.body === 'string') {
                res.end(response.body);
              } else {
                res.end(JSON.stringify(response.body));
              }
            } else {
              res.end();
            }
          } else {
            next();
          }
        } catch (error) {
          console.error('Better Auth error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    }
  };
}