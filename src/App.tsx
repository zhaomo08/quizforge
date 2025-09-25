
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
  const { state } = useApp();

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