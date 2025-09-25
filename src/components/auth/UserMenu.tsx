import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Mail,
  Calendar
} from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { useAuth } from './AuthProvider';

interface UserMenuProps {
  onLogout?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
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
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
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
                <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <User className="h-4 w-4 mr-3" />
                  个人资料
                </button>
                
                <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Settings className="h-4 w-4 mr-3" />
                  设置
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                <div className="px-4 py-2">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Mail className="h-3 w-3 mr-2" />
                    邮箱: {user.email}
                  </div>
                  {user.createdAt && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3 mr-2" />
                      注册: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

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