import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Brain, BookOpen, BarChart3, Settings, } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageToPath, pathToPage } from '@/routes';
import { useApp } from '@/contexts/AppContext';
import { UserMenu } from '@/components/auth/UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationCenter';

export const Navigation: React.FC = () => {
  const { dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = pathToPage[location.pathname] || 'home';

  const navigationItems: { id: string; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'analytics', label: '学习分析', icon: BarChart3 },
    { id: 'generate', label: 'AI出题', icon: Brain },
    { id: 'wrong-answers', label: '错题本', icon: BookOpen },
    { id: 'manage', label: '题库管理', icon: Settings },
  ];

  const handleNavigation = (page: string) => {
    const path = pageToPath[page];
    if (path && path !== location.pathname) {
      // 仍然同步 context 以兼容旧逻辑
      dispatch({ type: 'SET_PAGE', payload: page });
      dispatch({ type: 'RESET_TEST' });
      navigate(path);
    }
  };

  return (
    <nav className="bg-white/95 dark:bg-background/98 backdrop-blur-md border-b border-gray-200/50 dark:border-border/60 sticky top-0 z-50 shadow-sm dark:shadow-md transition-all duration-300">
      <div className="navigation-container px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[4rem]">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Brain className="h-8 w-8 text-blue-600 dark:text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-foreground transition-colors">AI面试助手</span>
            </div>
            
            <div className="hidden md:flex space-x-4">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={currentPage === id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigation(id)}
                  className={`flex items-center space-x-2 transition-all duration-200 hover:scale-105 ${
                    currentPage === id 
                      ? 'bg-primary text-primary-foreground shadow-md dark:shadow-lg' 
                      : 'hover:bg-accent/80 dark:hover:bg-accent/60 hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <NotificationBell />
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User Menu */}
            <UserMenu />
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex space-x-1">
              {navigationItems.map(({ id, icon: Icon }) => (
                <Button
                  key={id}
                  variant={currentPage === id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavigation(id)}
                  className={`transition-all duration-200 ${
                    currentPage === id 
                      ? 'bg-primary text-primary-foreground shadow-md dark:shadow-lg' 
                      : 'hover:bg-accent/80 dark:hover:bg-accent/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};