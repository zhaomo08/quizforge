import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pageToPath } from '@/routes';

interface BackButtonProps {
  to?: string;      // app page id 或直接传 path
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
  const navigate = useNavigate();

  const handleBack = () => {
    // 支持直接传路径（如 '/generate'）或 page id（如 'home'）
    if (to.startsWith('/')) {
      navigate(to);
    } else {
      const path = pageToPath[to];
      if (path) {
        navigate(path);
      } else {
        navigate(-1); // fallback: 浏览器返回
      }
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleBack} className={className}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};

export default BackButton;
