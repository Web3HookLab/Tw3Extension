import React, { useState, useMemo } from 'react';
import { ScrollArea } from '~src/components/ui/scroll-area';
import { Button } from '~src/components/ui/button';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import {
  AlertCircle,
  Wifi,
  WifiOff,
  Activity,
  Database,
  MoreHorizontal
} from 'lucide-react';

import { RealtimeCAItem } from './RealtimeCAItem';
import { FixedSkeleton } from './FixedSkeleton';
import type { CAEvent, ViewMode, ConnectionStatus } from '~src/types/realtime-ca.types';
import { useSettings } from '~src/contexts/SettingsContext';

interface RealtimeCAListProps {
  events: CAEvent[];
  viewMode: ViewMode;
  connectionStatus: ConnectionStatus;
  loading?: boolean;
  error?: string | null;
  onOpenAnalysis?: (tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  }) => void;
}

export function RealtimeCAList({
  events,
  viewMode,
  connectionStatus,
  loading = false,
  error = null,
  onOpenAnalysis
}: RealtimeCAListProps) {
  const { t } = useSettings();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(50); // 初始显示50条

  // 计算显示的事件
  const displayEvents = useMemo(() => {
    return events.slice(0, displayCount);
  }, [events, displayCount]);

  // 切换事件项展开状态
  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedItems(newExpanded);
  };

  // 加载更多
  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 50, events.length));
  };

  // 渲染连接状态提示
  const renderConnectionStatus = () => {
    if (viewMode === 'cache') {
      return null;
    }

    switch (connectionStatus) {
      case 'connecting':
        return (
          <Alert className="m-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>{t('realtimeCA.status.connectingDesc')}</AlertDescription>
          </Alert>
        );
      case 'reconnecting':
        return (
          <Alert className="m-4">
            <Wifi className="h-4 w-4" />
            <AlertDescription>{t('realtimeCA.status.reconnectingDesc')}</AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('realtimeCA.status.errorDesc')}</AlertDescription>
          </Alert>
        );
      case 'disconnected':
        return (
          <Alert className="m-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>{t('realtimeCA.status.disconnectedDesc')}</AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };


  // 渲染加载骨架
  const renderSkeleton = () => <FixedSkeleton count={displayCount > 10 ? 10 : displayCount} />;

  // 渲染空状态
  const renderEmptyState = () => {
    if (viewMode === 'realtime') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-2">
            {connectionStatus === 'connected' ? (
              <>
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">{t('realtimeCA.list.waitingData')}</p>
                <p className="text-sm">{t('realtimeCA.list.waitingDesc')}</p>
              </>
            ) : (
              <>
                <WifiOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">未连接</p>
                <p className="text-sm">点击连接按钮开始接收实时数据</p>
              </>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-2">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">暂无缓存数据</p>
            <p className="text-sm">切换到实时面板开始收集数据</p>
          </div>
        </div>
      );
    }
  };

  // 错误状态
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // 加载状态
  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="relative">
      {/* 连接状态提示 */}
      {renderConnectionStatus()}

      {/* 事件列表 */}
      {displayEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 p-1">
              {displayEvents.map((event, index) => {
                // 使用更稳定的key策略：用户ID + 推文ID + 代币地址组合
                const stableKey = `${event.data.user.rest_id}-${event.data.tweet.tweet_id}-${event.data.mentions?.[0]?.address || 'no-token'}`;

                return (
                  <RealtimeCAItem
                    key={stableKey}
                    event={event}
                    index={index}
                    isExpanded={expandedItems.has(event.id)}
                    onToggleExpanded={() => toggleExpanded(event.id)}
                    onOpenAnalysis={onOpenAnalysis}
                  />
                );
              })}
            </div>
          </ScrollArea>

          {/* 加载更多按钮 */}
          {displayCount < events.length && (
            <div className="flex justify-center p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                className="flex items-center gap-2"
              >
                <MoreHorizontal className="h-4 w-4" />
                加载更多 ({events.length - displayCount} 条剩余)
              </Button>
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex justify-between items-center px-4 py-2 text-xs text-muted-foreground border-t bg-muted/30">
            <span>
              显示 {displayEvents.length} / {events.length} 条事件
            </span>
            {viewMode === 'realtime' && (
              <span>
                {connectionStatus === 'connected' ? '实时更新中' : '已暂停'}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
