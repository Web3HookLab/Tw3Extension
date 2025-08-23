import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "~src/services/auth.service";
import { useSettings } from '~src/contexts/SettingsContext';
import { Storage } from '@plasmohq/storage';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Activity, Play, Pause } from 'lucide-react';


import { RealtimeCAControls } from './RealtimeCAControls';
import { RealtimeCAList } from './RealtimeCAList';
import { RealtimeCATokenBanner } from './RealtimeCATokenBanner';
import { TokenBannerSkeleton, ControlsSkeleton } from './FixedSkeleton';
import { RealtimeCAFilters } from './RealtimeCAFilters';
import { RealtimeCASearch } from './RealtimeCASearch';
import { RealtimeCASettings as SettingsDialog } from './RealtimeCASettings';
import { useWebSocket } from './hooks/useWebSocket';
import { useCACache } from './hooks/useCACache';
import { useHoverPause } from './hooks/useHoverPause';
import { useDataExport } from './hooks/useDataExport';

import { DEFAULT_SETTINGS, STORAGE_KEYS, DISPLAY_CONFIG } from './constants';
import { validateCAEvent, generateEventId } from './utils';

import type {
  CAEvent,
  ViewMode,
  RealtimeCASettings
} from '~src/types/realtime-ca.types';

const storage = new Storage({ area: 'local' });

export function RealtimeCAModule() {
  const { userInfo } = useAuth();
  const { t } = useSettings();

  // 状态管理
  const [viewMode, setViewMode] = useState<ViewMode>('realtime');
  const [settings, setSettings] = useState<RealtimeCASettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<CAEvent[]>([]);

  const [isPaused, setIsPaused] = useState(false);
  const [searchResults, setSearchResults] = useState<CAEvent[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hasAutoConnected, setHasAutoConnected] = useState(false); // 标记是否已经自动连接过
  const [manuallyDisconnected, setManuallyDisconnected] = useState(false); // 标记是否手动断开过

  // 权限检查 - 与TwitterTrends保持一致
  const canAccess = userInfo && userInfo.plan !== 'Free';

  // 自定义hooks
  const { isHovered, handleMouseEnter, handleMouseLeave } = useHoverPause();
  const { exportData } = useDataExport();
  const { cachedEvents, addEvent, clearCache, loadCache } = useCACache(settings.maxCacheSize);

  // 事件缓冲区（用于鼠标悬停时暂存事件）
  const [eventBuffer, setEventBuffer] = useState<CAEvent[]>([]);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket连接管理
  const {
    connectionStatus,
    isConnected,
    connect,
    disconnect,
    updateSubscription
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
    settings
  });

  // 加载设置和过滤器配置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 加载基础设置
        const saved = await storage.get(STORAGE_KEYS.SETTINGS) as RealtimeCASettings;
        let finalSettings = saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;

        // 过滤器配置现在统一存储在 settings.subscriptionConfig 中

        setSettings(finalSettings);
        console.log('✅ Settings loaded with filter config:', finalSettings.subscriptionConfig);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
    loadCache();
  }, []); // 只在组件挂载时执行一次

  // 保存设置
  const saveSettings = async (newSettings: RealtimeCASettings) => {
    try {
      await storage.set(STORAGE_KEYS.SETTINGS, newSettings);
      setSettings(newSettings);

      // 更新订阅配置
      if (isConnected) {
        updateSubscription(newSettings.subscriptionConfig);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // 首次访问自动连接（只连接一次，且未手动断开过）
  useEffect(() => {
    if (canAccess && settings.autoConnect && !isConnected && !hasAutoConnected && !manuallyDisconnected && connectionStatus === 'disconnected') {
      console.log(t('realtimeCA.module.autoConnectLog'));
      setHasAutoConnected(true);
      connect();
    }
  }, [canAccess, settings.autoConnect, isConnected, hasAutoConnected, manuallyDisconnected, connectionStatus, connect]);

  // 处理WebSocket消息
  function handleWebSocketMessage(event: CAEvent) {
    if (!validateCAEvent(event)) {
      console.warn('Invalid CA event received:', event);
      return;
    }

    // 添加本地字段
    const enhancedEvent: CAEvent = {
      ...event,
      id: generateEventId(),
      received_at: Date.now()
    };

    // 始终添加到缓存（即使暂停也要缓存数据）
    addEvent(enhancedEvent);

    // 实时模式处理
    if (viewMode === 'realtime') {
      if (isPaused) {
        // 暂停状态：只缓存数据，不更新UI，但添加到缓冲区
        setEventBuffer(prev => [enhancedEvent, ...prev]);
      } else if (isHovered) {
        // 鼠标悬停时添加到缓冲区
        setEventBuffer(prev => [enhancedEvent, ...prev]);
      } else {
        // 直接添加到实时显示
        setRealtimeEvents(prev =>
          [enhancedEvent, ...prev].slice(0, DISPLAY_CONFIG.REALTIME_SIZE)
        );
      }
    }
  }

  // 处理缓冲区事件（鼠标离开且未暂停时，或恢复暂停时）
  useEffect(() => {
    if ((!isHovered && !isPaused) && eventBuffer.length > 0) {
      // 清除之前的定时器
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      // 延迟处理，避免频繁更新
      bufferTimeoutRef.current = setTimeout(() => {
        setRealtimeEvents(prev => {
          const newEvents = [...eventBuffer, ...prev];
          return newEvents.slice(0, DISPLAY_CONFIG.REALTIME_SIZE);
        });
        setEventBuffer([]);
      }, DISPLAY_CONFIG.UPDATE_DEBOUNCE);
    }

    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, [isHovered, isPaused, eventBuffer]);

  // 切换暂停/恢复
  const togglePause = () => {
    setIsPaused(!isPaused);
    console.log(isPaused ? t('realtimeCA.module.resumeRendering') : t('realtimeCA.module.pauseRendering'));
  };

  // 将 SubscriptionConfig 转换为 FilterConfig 格式
  const subscriptionToFilterConfig = (subscriptionConfig: any) => {
    return {
      network: subscriptionConfig.network,
      minFollowers: subscriptionConfig.min_followers,
      filters: subscriptionConfig.filters
    };
  };

  // 处理过滤器变化
  const handleFiltersChange = async (filters: any) => {
    console.log('🔍 Filters changed:', filters);

    // 更新settings中的订阅配置
    const newSubscriptionConfig = {
      ...settings.subscriptionConfig,
      network: filters.network,
      min_followers: filters.minFollowers,
      filters: filters.filters
    };

    const newSettings = {
      ...settings,
      subscriptionConfig: newSubscriptionConfig
    };

    try {
      // 保存到存储
      await storage.set(STORAGE_KEYS.SETTINGS, newSettings);
      setSettings(newSettings);
      console.log('💾 Saved filter settings:', newSubscriptionConfig);

      // 如果连接状态下，重新订阅
      if (isConnected) {
        console.log('🔄 Resubscribing with new filters...');
        updateSubscription(newSubscriptionConfig);
      }
    } catch (error) {
      console.error('❌ Failed to save filter settings:', error);
    }
  };

  // 处理搜索结果
  const handleSearchResults = (results: CAEvent[]) => {
    setSearchResults(results);
    setIsSearchActive(results.length !== cachedEvents.length);
    console.log(`🔍 Search results: ${results.length} / ${cachedEvents.length}`);
  };



  // 手动连接/断开（简化版，参考原型逻辑）
  const handleConnect = () => {
    if (isConnected) {
      console.log(t('realtimeCA.module.manualDisconnectLog'));
      // 手动断开时，标记为手动断开，防止自动重连
      setManuallyDisconnected(true);
      setHasAutoConnected(false);
      disconnect();
    } else {
      console.log(t('realtimeCA.module.manualConnectLog'));
      // 手动连接时，清除手动断开标记
      setManuallyDisconnected(false);
      connect();
    }
  };

  // 切换视图模式
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // 切换到实时模式时，如果设置了自动连接且未手动断开过，则自动连接
    if (mode === 'realtime' && !isConnected && settings.autoConnect && !manuallyDisconnected) {
      console.log(t('realtimeCA.module.switchToRealtimeLog'));
      connect();
    }
  };

  // 导出数据处理
  const handleExportData = () => {
    const eventsToExport = viewMode === 'cache' ? cachedEvents : realtimeEvents;
    if (eventsToExport.length === 0) {
      alert(t('realtimeCA.export.noDataToExport'));
      return;
    }

    // 默认导出为CSV格式，包含元数据
    exportData(eventsToExport, {
      format: 'csv',
      includeMetadata: true
    });
  };

  // 清理缓存
  const handleClearCache = async () => {
    clearCache();
    setRealtimeEvents([]);
    setEventBuffer([]);
  };

  // 获取显示的事件列表
  const getDisplayEvents = (): CAEvent[] => {
    // 如果有搜索结果，优先显示搜索结果
    if (isSearchActive) {
      return searchResults;
    }

    if (viewMode === 'realtime') {
      return realtimeEvents;
    } else {
      return cachedEvents;
    }
  };

  // 权限检查 - 与TwitterTrends保持一致的UI
  if (!canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('realtimeCA.module.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {t('realtimeCA.module.upgradeRequired')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('realtimeCA.module.title')}
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className="ml-2"
            >
              {isConnected ? t('realtimeCA.module.connected') : t('realtimeCA.module.disconnected')}
            </Badge>
          </CardTitle>

          {/* 控制按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              onClick={handleConnect}
              disabled={connectionStatus === 'connecting' || connectionStatus === 'reconnecting'}
              className="flex items-center gap-1"
            >
              {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  {connectionStatus === 'connecting' ? t('realtimeCA.module.connecting') : t('realtimeCA.module.reconnecting')}
                </>
              ) : isConnected ? (
                <>
                  <Pause className="h-4 w-4" />
                  {t('realtimeCA.module.disconnect')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {t('realtimeCA.module.startMonitoring')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">




        {/* 热门代币横幅 - 始终显示，基于缓存数据 */}
        <div className="p-4 border-b">
          {cachedEvents.length === 0 && connectionStatus === 'connecting' ? (
            <TokenBannerSkeleton />
          ) : (
            <RealtimeCATokenBanner
              events={cachedEvents}
            />
          )}
        </div>

        {/* 控制面板 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <RealtimeCAControls
              viewMode={viewMode}
              connectionStatus={connectionStatus}
              isPaused={isPaused}
              cacheCount={cachedEvents.length}
              onViewModeChange={handleViewModeChange}
              onSettingsClick={() => setShowSettings(true)}
              onClearCache={handleClearCache}
              onTogglePause={togglePause}
              onExportData={handleExportData}
            />

            {/* 过滤器组件 - 放在设置按钮旁边 */}
            <div className="flex items-center gap-2">
              <RealtimeCAFilters
                onFiltersChange={handleFiltersChange}
                isConnected={isConnected}
                initialFilters={subscriptionToFilterConfig(settings.subscriptionConfig)}
              />
            </div>
          </div>

          {/* 搜索组件 - 只在缓存模式下显示 */}
          {viewMode === 'cache' && (
            <RealtimeCASearch
              events={cachedEvents}
              onSearchResults={handleSearchResults}
            />
          )}
        </div>

        {/* 事件列表 */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <RealtimeCAList
            events={getDisplayEvents()}
            viewMode={viewMode}
            connectionStatus={connectionStatus}
          />
        </div>

        {/* 悬停暂停提示 - 静默显示，不显示文字 */}
        {isHovered && viewMode === 'realtime' && eventBuffer.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
              {eventBuffer.length} {t('realtimeCA.list.pendingUpdates')}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* 设置对话框 */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSettingsChange={saveSettings}
        cacheCount={cachedEvents.length}
        onClearCache={handleClearCache}
      />
    </Card>
  );
}
