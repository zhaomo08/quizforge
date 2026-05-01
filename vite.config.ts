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
    build: {
      // 关闭 sourcemap（生产环境减小产物体积）
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // Radix UI 组件库单独 chunk（30+ 个包）
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            // Recharts 图表库
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) {
              return 'vendor-charts'
            }
            // PDF 导出库（按需只在使用时加载，此 chunk 作为分组标记）
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'vendor-pdf'
            }
            // React 核心
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react'
            }
            // 其他 node_modules 统一归入 vendor
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})