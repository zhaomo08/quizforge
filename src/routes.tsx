import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

// 懒加载页面组件，实现代码分割 (为命名导出补充 default)
const HomePage = React.lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const AnalyticsPage = React.lazy(() => import('./components/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const CategorySelection = React.lazy(() => import('./components/CategorySelection').then(m => ({ default: m.CategorySelection })));
const TestSetup = React.lazy(() => import('./components/TestSetup').then(m => ({ default: m.TestSetup })));
const EnhancedTestPage = React.lazy(() => import('./components/EnhancedTestPage').then(m => ({ default: m.EnhancedTestPage })));
const EnhancedResultPage = React.lazy(() => import('./components/EnhancedResultPage').then(m => ({ default: m.EnhancedResultPage })));
const WrongAnswersPage = React.lazy(() => import('./components/WrongAnswersPage').then(m => ({ default: m.WrongAnswersPage })));
const GeneratePage = React.lazy(() => import('./components/GeneratePage').then(m => ({ default: m.GeneratePage })));
const ManagePage = React.lazy(() => import('./components/ManagePage').then(m => ({ default: m.ManagePage })));
const SmartLearningAssistant = React.lazy(() => import('./components/SmartLearningAssistant').then(m => ({ default: m.SmartLearningAssistant })));
const GoogleOAuthManager = React.lazy(() => import('./components/auth/GoogleOAuthManager').then(m => ({ default: m.GoogleOAuthManager })));
const ApiKeyManager = React.lazy(() => import('./components/ApiKeyManager').then(m => ({ default: m.ApiKeyManager })));

export const appRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/category', element: <CategorySelection /> },
  { path: '/test-setup', element: <TestSetup /> },
  { path: '/test', element: <EnhancedTestPage /> },
  { path: '/result', element: <EnhancedResultPage /> },
  { path: '/wrong-answers', element: <WrongAnswersPage /> },
  { path: '/generate', element: <GeneratePage /> },
  { path: '/manage', element: <ManagePage /> },
  { path: '/learning-assistant', element: <SmartLearningAssistant /> },
  { path: '/google-oauth', element: <GoogleOAuthManager /> },
  { path: '/api-keys', element: <ApiKeyManager /> },
  { path: '*', element: <Navigate to="/" replace /> }
];

// 提供旧 currentPage 字符串与路径之间的映射，便于过渡阶段同步
export const pageToPath: Record<string, string> = {
  home: '/',
  analytics: '/analytics',
  category: '/category',
  'test-setup': '/test-setup',
  test: '/test',
  result: '/result',
  'wrong-answers': '/wrong-answers',
  generate: '/generate',
  manage: '/manage',
  'learning-assistant': '/learning-assistant',
  'google-oauth': '/google-oauth',
  'api-keys': '/api-keys'
};

export const pathToPage: Record<string, string> = Object.fromEntries(
  Object.entries(pageToPath).map(([k, v]) => [v, k])
);
