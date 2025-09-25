import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LogOut, 
  ChevronDown,
  Key
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useApp } from '@/contexts/AppContext';

interface UserMenuProps {
  onLogout?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showAvatarImage, setShowAvatarImage] = useState(!!user?.picture);

  React.useEffect(() => {
    setShowAvatarImage(!!user?.picture);
  }, [user?.picture]);

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleGoogleLogin = () => {
    // 重定向到Google OAuth
    window.location.href = '/api/auth/sign-in/google';
  };

  // 如果用户未登录，显示登录按钮
  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={handleGoogleLogin}
        className="flex items-center space-x-2"
        size="sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Google登录</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2"
      >
        {showAvatarImage && user?.picture ? (
          <img 
            src={user.picture} 
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full"
            onError={() => setShowAvatarImage(false)}
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {user.name || user.email}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <Card className="absolute right-0 top-full mt-2 w-64 z-20 shadow-lg">
            <CardContent className="p-0">
              {/* User Info */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {showAvatarImage && user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.name || user.email}
                      className="w-12 h-12 rounded-full"
                      onError={() => setShowAvatarImage(false)}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name || '用户'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button 
                  onClick={() => {
                    dispatch({ type: 'SET_PAGE', payload: 'api-keys' });
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Key className="h-4 w-4 mr-3" />
                  API Key 管理
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  退出登录
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};