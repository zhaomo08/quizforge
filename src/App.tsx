import React from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/components/HomePage';
import { CategorySelection } from '@/components/CategorySelection';
import { TestSetup } from '@/components/TestSetup';
import { TestPage } from '@/components/TestPage';
import { ResultPage } from '@/components/ResultPage';
import { WrongAnswersPage } from '@/components/WrongAnswersPage';
import { GeneratePage } from '@/components/GeneratePage';
import { ManagePage } from '@/components/ManagePage';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function AppContent() {
  const { state } = useApp();

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'home':
        return <HomePage />;
      case 'category':
        return <CategorySelection />;
      case 'test-setup':
        return <TestSetup />;
      case 'test':
        return <TestPage />;
      case 'result':
        return <ResultPage />;
      case 'wrong-answers':
        return <WrongAnswersPage />;
      case 'generate':
        return <GeneratePage />;
      case 'manage':
        return <ManagePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pb-8">
        {renderCurrentPage()}
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;