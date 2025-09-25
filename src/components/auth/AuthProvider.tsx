import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthPage } from './AuthPage';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  requireAuth = false 
}) => {
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 自定义session获取
  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include', // 包含cookies
      });
      const data = await response.json();
      setSession(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setSession({ user: null, session: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    
    // 监听URL变化，如果有登录成功参数，重新获取session
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      setTimeout(fetchSession, 500); // 稍微延迟以确保cookie已设置
    }
  }, []);

  const isAuthenticated = !!session?.user;
  const user = session?.user || null;

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      setShowAuth(true);
    } else if (isAuthenticated) {
      setShowAuth(false);
    }
  }, [requireAuth, isAuthenticated, isLoading]);

  const handleSignOut = async () => {
    try {
      // 调用我们的退出登录API
      await fetch('/api/auth/sign-out', {
        method: 'GET',
        credentials: 'include',
      });
      
      // 清除本地session状态
      setSession({ user: null, session: null });
      
      if (requireAuth) {
        setShowAuth(true);
      }
      
      // 重定向到首页
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    signOut: handleSignOut,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <AuthContext.Provider value={contextValue}>
        <AuthPage onSuccess={() => setShowAuth(false)} />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};