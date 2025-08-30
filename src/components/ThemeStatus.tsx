import React from 'react';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';

export function ThemeStatus() {
  const { theme, systemTheme } = useTheme();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  return (
    <Badge variant="outline" className="text-xs">
      {currentTheme === 'dark' ? '🌙' : '☀️'} {
        theme === 'system' ? '跟随系统' : 
        theme === 'dark' ? '深色模式' : '浅色模式'
      }
    </Badge>
  );
}