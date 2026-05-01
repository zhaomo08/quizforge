
import React, { useEffect } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { useLocation, useRoutes } from 'react-router-dom';
import { appRoutes, pathToPage } from './routes';
import { PageSkeleton } from '@/components/PageSkeleton';
import './App.css';
import './dark-mode-fix.css';

function AppContent() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const element = useRoutes(appRoutes);

  // 初次或路由变化时，将 path 同步到 context 中的 currentPage（过渡期保留，以免其他逻辑依赖）
  useEffect(() => {
    const path = location.pathname;
    const mapped = pathToPage[path];
    if (mapped && mapped !== state.currentPage) {
      dispatch({ type: 'SET_PAGE', payload: mapped });
    }
  }, [location.pathname, state.currentPage, dispatch]);

  // 根据当前路由选择对应骨架屏变体
  const getSkeletonVariant = () => {
    if (location.pathname === '/' || location.pathname === '/home') return 'home';
    if (location.pathname === '/analytics') return 'analytics';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:bg-gradient-to-br transition-colors duration-300">
      <Navigation />
      <main className="main-container content-width-stable">
        <div className="page-transition-stable">
          <React.Suspense fallback={<PageSkeleton variant={getSkeletonVariant()} />}>
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