import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthPage } from './AuthPage';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
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
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState<any>(null);

  // 暂时使用本地状态管理，不依赖Better Auth
  const isAuthenticated = !!session?.user;
  const user = session?.user || null;

  useEffect(() => {
    // 模拟加载过程
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (requireAuth && !isAuthenticated) {
        setShowAuth(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [requireAuth, isAuthenticated]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
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