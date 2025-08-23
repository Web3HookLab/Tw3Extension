import React from 'react';
import { Button } from '~src/components/ui/button';
import {
  Play,
  Settings,
  Trash2,
  Activity,
  Pause,
  Database,
  Download
} from 'lucide-react';
import { CONNECTION_STATUS_COLORS, CONNECTION_STATUS_TEXT } from './constants';
import type { ViewMode, ConnectionStatus } from '~src/types/realtime-ca.types';
import { useSettings } from '~src/contexts/SettingsContext';

interface RealtimeCAControlsProps {
  viewMode: ViewMode;
  connectionStatus: ConnectionStatus;
  isPaused?: boolean;
  cacheCount?: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onClearCache: () => void;
  onTogglePause?: () => void;
  onExportData?: () => void;
}

export function RealtimeCAControls({
  viewMode,
  connectionStatus,
  isPaused = false,
  cacheCount = 0,
  onViewModeChange,
  onSettingsClick,
  onClearCache,
  onTogglePause,
  onExportData
}: RealtimeCAControlsProps) {
  const { t } = useSettings();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 视图模式切换 */}
      <div className="flex items-center gap-1 border rounded-md p-1">
        <Button
          variant={viewMode === 'realtime' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('realtime')}
          className="h-7 px-2 text-xs"
        >
          <Activity className="h-3 w-3 mr-1" />
          {t('realtimeCA.controls.realtimePanel')}
        </Button>
        <Button
          variant={viewMode === 'cache' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('cache')}
          className="h-7 px-2 text-xs"
        >
          <Database className="h-3 w-3 mr-1" />
          {t('realtimeCA.controls.dataCache')}
        </Button>
      </div>
      
      {/* 连接状态指示器 - 只显示状态，不显示控制按钮 */}
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${CONNECTION_STATUS_COLORS[connectionStatus]}`}
        />
        <span className="text-xs text-muted-foreground">
          {CONNECTION_STATUS_TEXT[connectionStatus]}
        </span>
      </div>

      {/* 设置按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSettingsClick}
        className="h-7 px-2"
      >
        <Settings className="h-3 w-3 mr-1" />
        {t('realtimeCA.controls.settings')}
      </Button>

      {/* 导出数据按钮 - 只在缓存模式下显示 */}
      {viewMode === 'cache' && onExportData && cacheCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportData}
          className="h-7 px-2"
        >
          <Download className="h-3 w-3 mr-1" />
          {t('realtimeCA.export.exportData')}
        </Button>
      )}

      {/* 清理缓存按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearCache}
        className="h-7 px-2 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        {t('realtimeCA.controls.clear')}
      </Button>

      {/* 暂停/恢复按钮 - 只在实时模式下显示 */}
      {viewMode === 'realtime' && onTogglePause && (
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePause}
          className="h-7 px-2"
          title={isPaused ? t('realtimeCA.controls.resumeTooltip') : t('realtimeCA.controls.pauseTooltip')}
        >
          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </Button>
      )}
    </div>
  );
}
