import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const plugins: any[] = [react()]
  if (command === 'serve') {
    // 仅在本地开发服务时加载 Better Auth 中间件
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { betterAuthPlugin } = require('./vite-auth-plugin.js')
    plugins.push(betterAuthPlugin())
  }
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})