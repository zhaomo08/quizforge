
import React, { useEffect } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import { appRoutes, pathToPage, pageToPath } from './routes';
import './App.css';
import './dark-mode-fix.css';

function AppContent() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const element = useRoutes(appRoutes);

  // 初次或路由变化时，将 path 同步到 context 中的 currentPage（过渡期保留，以免其他逻辑依赖）
  useEffect(() => {
    const path = location.pathname;
    const mapped = pathToPage[path];
    if (mapped && mapped !== state.currentPage) {
      dispatch({ type: 'SET_PAGE', payload: mapped });
    }
  }, [location.pathname, state.currentPage, dispatch]);

  // 如果 reducer 触发改变了 currentPage（旧逻辑），同步跳转到对应新路由
  useEffect(() => {
    const expectedPath = pageToPath[state.currentPage];
    if (expectedPath && expectedPath !== location.pathname) {
      navigate(expectedPath, { replace: false });
    }
  }, [state.currentPage, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:bg-gradient-to-br transition-colors duration-300">
      <Navigation />
      <main className="main-container content-width-stable">
        <div className="page-transition-stable">
          <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">加载中...</div>}>
            {element}
          </React.Suspense>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider requireAuth={false}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;