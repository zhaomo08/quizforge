import React from 'react';
import { BackButton } from '@/components/BackButton';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  sticky?: boolean; // 是否吸顶
  showSubtitleOnMobile?: boolean; // 移动端是否展示副标题
  rightArea?: React.ReactNode; // 右侧自定义区域（状态/按钮等）
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo = 'home',
  backLabel = '返回',
  sticky = false,
  showSubtitleOnMobile = false,
  rightArea,
  className = '',
}) => {
  const wrapperBase = sticky
    ? 'sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
    : '';

  return (
    <div className={`${wrapperBase} ${className}`}>
      <div className={`flex items-center justify-between ${sticky ? 'p-4' : 'mb-8'}`}>
        <div className="flex items-center space-x-3">
          <BackButton to={backTo} label={backLabel} />
          <div>
            <h1 className="font-bold text-gray-900 dark:text-foreground text-2xl md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p
                className={`text-sm text-gray-600 dark:text-muted-foreground ${
                  showSubtitleOnMobile ? '' : 'hidden sm:block'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightArea && <div className="flex items-center">{rightArea}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
