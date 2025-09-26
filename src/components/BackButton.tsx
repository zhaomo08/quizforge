import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface BackButtonProps {
  to?: string; // app page id
  label?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const BackButton: React.FC<BackButtonProps> = ({
  to = 'home',
  label = '返回',
  className = 'mr-4',
  size = 'sm',
  variant = 'ghost',
}) => {
  const { dispatch } = useApp();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => dispatch({ type: 'SET_PAGE', payload: to })}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default BackButton;
