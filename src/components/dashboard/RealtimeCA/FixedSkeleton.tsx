import React from 'react';
import { Skeleton } from '~src/components/ui/skeleton';

interface FixedSkeletonProps {
  count?: number;
}

// 固定尺寸的骨架屏，防止CLS
export const FixedSkeleton = React.memo(function FixedSkeleton({ 
  count = 3 
}: FixedSkeletonProps) {
  return (
    <div className="space-y-1 p-1">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="p-4 border rounded-lg"
          style={{
            minHeight: '140px', // 固定最小高度，防止CLS
            height: '140px'
          }}
        >
          {/* 用户信息行 - 固定高度 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* 头像骨架 - 固定尺寸 */}
              <Skeleton 
                className="rounded-full flex-shrink-0" 
                style={{ width: 40, height: 40 }}
              />
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </div>
            
            {/* 展开按钮骨架 */}
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          
          {/* 推文内容骨架 - 固定高度 */}
          <div className="mb-3" style={{ height: '48px' }}>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* 代币信息骨架 - 固定高度 */}
          <div style={{ height: '32px' }}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// 热门代币横幅骨架屏
export const TokenBannerSkeleton = React.memo(function TokenBannerSkeleton() {
  return (
    <div 
      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-800"
      style={{ height: '48px' }} // 固定高度防止CLS
    >
      <div className="flex items-center gap-3 h-full">
        {/* 标题骨架 */}
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* 代币列表骨架 */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton 
                key={index} 
                className="h-7 w-20 rounded shrink-0" 
              />
            ))}
          </div>
        </div>
        
        {/* 状态骨架 */}
        <div className="shrink-0">
          <Skeleton className="h-5 w-12 rounded" />
        </div>
      </div>
    </div>
  );
});

// 控制面板骨架屏
export const ControlsSkeleton = React.memo(function ControlsSkeleton() {
  return (
    <div 
      className="flex items-center justify-between p-4 border-b"
      style={{ height: '72px' }} // 固定高度
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
});
