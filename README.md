# QuizForge - AI自动出题面试自测平台

一个基于AI的智能面试题目生成和自测平台，帮助用户准备技术面试和提升专业技能。

## 🚀 功能特性

- **AI智能出题**: 基于不同技术领域自动生成面试题目
- **多种题型支持**: 选择题、编程题、开放性问题等
- **个性化学习**: 根据答题情况提供智能学习建议
- **错题回顾**: 专门的错题页面帮助巩固薄弱知识点
- **数据分析**: 详细的答题统计和学习进度分析
- **Google OAuth**: 安全的用户认证系统
- **响应式设计**: 支持桌面端和移动端
- **暗色模式**: 护眼的深色主题支持

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Radix UI + Tailwind CSS
- **状态管理**: React Context
- **认证系统**: Better Auth + Google OAuth
- **表单处理**: React Hook Form + Zod
- **图表组件**: Recharts
- **通知系统**: Sonner

## 📋 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd quizforge
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# Google OAuth 配置
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# 其他配置...
```

### 4. 启动开发服务器

```bash
npm run dev
```

项目将在 `http://localhost:5173` 启动（如果端口被占用会自动选择其他端口）。

### 5. 构建生产版本

```bash
npm run build
```

### 6. 预览生产版本

```bash
npm run preview
```

## 🔧 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run lint` - 运行ESLint代码检查
- `npm run preview` - 预览生产版本
- `npm run test:oauth` - 测试Google OAuth配置
- `npm run setup:oauth` - OAuth设置向导

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── auth/           # 认证相关组件
│   ├── ui/             # 基础UI组件
│   └── ...             # 其他功能组件
├── contexts/           # React Context
├── lib/                # 工具库
├── utils/              # 工具函数
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 🔐 Google OAuth 配置

项目集成了Google OAuth认证系统。详细配置步骤请参考：

- `GOOGLE_OAUTH_COMPLETE_SETUP.md` - 完整设置指南
- `GOOGLE_OAUTH_FINAL_GUIDE.md` - 最终配置指南
- `AUTH_IMPLEMENTATION_SUMMARY.md` - 认证实现总结

## 📱 主要页面

- **首页**: 平台介绍和快速开始
- **题目生成**: AI智能生成面试题目
- **测试页面**: 在线答题和实时评分
- **结果分析**: 详细的答题报告和建议
- **错题回顾**: 专门的错题练习
- **数据分析**: 学习进度和统计图表
- **题目管理**: 自定义题目库管理

## 🎨 主题支持

项目支持明暗两种主题模式，用户可以根据偏好自由切换。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🐛 问题反馈

如果您遇到任何问题或有功能建议，请在 [Issues](../../issues) 页面提交。

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！