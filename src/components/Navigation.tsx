import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Brain, BookOpen, BarChart3 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export const Navigation: React.FC = () => {
  const { state, dispatch } = useApp();

  const navigationItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'generate', label: 'AI出题', icon: Brain },
    { id: 'wrong-answers', label: '错题本', icon: BookOpen },
    { id: 'manage', label: '题库管理', icon: BarChart3 },
  ];

  const handleNavigation = (page: string) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    dispatch({ type: 'RESET_TEST' });
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI面试助手</span>
            </div>
            
            <div className="hidden md:flex space-x-4">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={state.currentPage === id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigation(id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex space-x-2">
            {navigationItems.map(({ id, icon: Icon }) => (
              <Button
                key={id}
                variant={state.currentPage === id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavigation(id)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};