/*
 * Copyright (C) 2025 saymeevetime.cn
 *
 * @author Chester
 * @date 2026-04-29
 * @description 页面级骨架屏组件 - 用于 React.Suspense fallback，替代纯文字 "加载中..."
 */

import React from 'react';

interface PageSkeletonProps {
  /** 变体：home=首页卡片组, analytics=图表页, default=通用 */
  variant?: 'home' | 'analytics' | 'default';
}

/** 单个骨架块 */
const Bone: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-muted rounded-lg animate-pulse ${className}`} />
);

/** 首页骨架：4 个统计卡 + 列表区域 */
const HomePageSkeleton: React.FC = () => (
  <div className="page-container space-y-6 pt-6">
    <Bone className="h-9 w-1/3" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Bone className="h-28" />
      <Bone className="h-28" />
      <Bone className="h-28" />
      <Bone className="h-28" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Bone className="h-40" />
      <Bone className="h-40" />
      <Bone className="h-40" />
    </div>
    <Bone className="h-48" />
  </div>
);

/** 分析页骨架：顶部过滤 + 两个图表区 */
const AnalyticsPageSkeleton: React.FC = () => (
  <div className="page-container space-y-6 pt-6">
    <div className="flex gap-3">
      <Bone className="h-8 w-20" />
      <Bone className="h-8 w-20" />
      <Bone className="h-8 w-20" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Bone className="h-24" />
      <Bone className="h-24" />
      <Bone className="h-24" />
      <Bone className="h-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Bone className="h-64" />
      <Bone className="h-64" />
    </div>
    <Bone className="h-56" />
  </div>
);

/** 通用骨架 */
const DefaultSkeleton: React.FC = () => (
  <div className="page-container space-y-5 pt-6">
    <Bone className="h-9 w-1/3" />
    <Bone className="h-5 w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Bone className="h-36" />
      <Bone className="h-36" />
    </div>
    <Bone className="h-60" />
  </div>
);

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'home') return <HomePageSkeleton />;
  if (variant === 'analytics') return <AnalyticsPageSkeleton />;
  return <DefaultSkeleton />;
};
