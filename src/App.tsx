
import React from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/components/HomePage';
import { CategorySelection } from '@/components/CategorySelection';
import { TestSetup } from '@/components/TestSetup';
import { TestPage } from '@/components/TestPage';
import { EnhancedTestPage } from '@/components/EnhancedTestPage';
import { ResultPage } from '@/components/ResultPage';
import { EnhancedResultPage } from '@/components/EnhancedResultPage';
import { WrongAnswersPage } from '@/components/WrongAnswersPage';
import { GeneratePage } from '@/components/GeneratePage';
import { ManagePage } from '@/components/ManagePage';
import { AnalyticsPage } from '@/components/AnalyticsPage';
import { SmartLearningAssistant } from '@/components/SmartLearningAssistant';
import { GoogleOAuthManager } from '@/components/auth/GoogleOAuthManager';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { Toaster } from '@/components/ui/sonner';
import './App.css';
import './dark-mode-fix.css';

function AppContent() {
  const { state, dispatch } = useApp();

  // Keep URL (?p=page) and app state in sync so browser back/forward works
  React.useEffect(() => {
    const allowedPages = new Set([
      'home',
      'analytics',
      'category',
      'test-setup',
      'test',
      'result',
      'wrong-answers',
      'generate',
      'manage',
      'learning-assistant',
      'google-oauth',
      'api-keys',
    ]);

    // On initial load, if URL has ?p=, navigate app state accordingly
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('p');
    if (initial && allowedPages.has(initial)) {
      dispatch({ type: 'SET_PAGE', payload: initial });
    }

    // Popstate listener to handle browser back/forward
    const onPopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const p = sp.get('p');
      if (p && allowedPages.has(p)) {
        dispatch({ type: 'SET_PAGE', payload: p });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [dispatch]);

  // When currentPage changes, push it into URL query for history navigation
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('p') === state.currentPage) return;
    sp.set('p', state.currentPage);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.pushState({ page: state.currentPage }, '', newUrl);
  }, [state.currentPage]);

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'home':
        return <HomePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'category':
        return <CategorySelection />;
      case 'test-setup':
        return <TestSetup />;
      case 'test':
        return <EnhancedTestPage />;
      case 'result':
        return <EnhancedResultPage />;
      case 'wrong-answers':
        return <WrongAnswersPage />;
      case 'generate':
        return <GeneratePage />;
      case 'manage':
        return <ManagePage />;
      case 'learning-assistant':
        return <SmartLearningAssistant />;
      case 'google-oauth':
        return <GoogleOAuthManager />;
      case 'api-keys':
        return <ApiKeyManager />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:bg-gradient-to-br transition-colors duration-300">
      <Navigation />
      <main className="main-container content-width-stable">
        <div className="page-transition-stable">
          {renderCurrentPage()}
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