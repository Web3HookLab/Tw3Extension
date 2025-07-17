import React, { useState, useEffect } from 'react';
import { Badge } from './badge';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { RefreshCw, Wifi, WifiOff, User } from 'lucide-react';
import { API_CONFIG, REFRESH_CONFIG } from '~src/config/config';
import { useAuth } from '~src/services/auth.service';

interface ServerStatusBadgeProps {
  showText?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  enableUserStatusRefresh?: boolean; // 是否启用用户状态刷新功能
}

type ServerStatus = 'checking' | 'online' | 'offline' | 'error';

// 服务器健康检查响应接口
interface HealthCheckResponse {
  code: number;
  msg: string;
  data?: {
    status: string;
    response_time_ms: number;
  };
  timestamp?: string;
}

function ServerStatusBadge({
  showText = true,
  size: _size = 'default',
  className,
  enableUserStatusRefresh = false
}: ServerStatusBadgeProps) {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUserRefresh, setLastUserRefresh] = useState<Date | null>(null);
  const [isUserRefreshing, setIsUserRefreshing] = useState(false);

  const { refreshUserStatus } = useAuth();

  // 刷新用户状态
  const refreshUserStatusWithCooldown = async () => {
    // 检查冷却时间
    if (lastUserRefresh && Date.now() - lastUserRefresh.getTime() < REFRESH_CONFIG.MANUAL_REFRESH_COOLDOWN) {
      console.log('⏰ 用户状态刷新冷却中，请稍后再试');
      return;
    }

    setIsUserRefreshing(true);
    try {
      console.log('🔄 手动刷新用户状态');
      await refreshUserStatus();
      setLastUserRefresh(new Date());
      console.log('✅ 用户状态刷新成功');
    } catch (error) {
      console.error('❌ 用户状态刷新失败:', error);
    } finally {
      setIsUserRefreshing(false);
    }
  };

  // 检查服务器状态
  const checkServerStatus = async () => {
    setIsRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.HEALTH_CHECK}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tw3Track-Extension/1.0',
        }
      });

      clearTimeout(timeoutId);

      // 解析响应内容
      let responseData: HealthCheckResponse;
      try {
        responseData = await response.json() as HealthCheckResponse;
      } catch (jsonError) {
        setStatus('error');
        setLastChecked(new Date());
        return;
      }

      // 验证响应格式和内容
      if (responseData.code === 200 && responseData.msg === "server online") {
        setStatus('online');
        // 可选：显示响应时间
        if (responseData.data?.response_time_ms) {
          console.log(`✅ Server online - Response time: ${responseData.data.response_time_ms}ms`);
        }
      } else {
        setStatus('offline');
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error('Server status check failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus('offline');
      } else {
        setStatus('error');
      }
      setLastChecked(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // 初始检查和定时检查
  useEffect(() => {
    checkServerStatus();
    
    // 每30秒检查一次
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 获取状态显示信息
  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          variant: 'secondary' as const,
          icon: <RefreshCw className="w-3 h-3 animate-spin" />,
          text: 'Checking...',
          color: 'text-blue-600'
        };
      case 'online':
        return {
          variant: 'default' as const,
          icon: <Wifi className="w-3 h-3" />,
          text: 'Online',
          color: 'text-green-600'
        };
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Offline',
          color: 'text-red-600'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Error',
          color: 'text-red-600'
        };
    }
  };

  // 综合刷新处理函数
  const handleRefresh = async () => {
    // 同时刷新服务器状态和用户状态（如果启用）
    const promises = [checkServerStatus()];

    if (enableUserStatusRefresh) {
      promises.push(refreshUserStatusWithCooldown());
    }

    await Promise.all(promises);
  };

  const statusInfo = getStatusInfo();
  const isAnyRefreshing = isRefreshing || isUserRefreshing;

  const badgeContent = (
    <Badge
      variant={statusInfo.variant}
      className={`cursor-pointer transition-all hover:scale-105 ${className}`}
      onClick={handleRefresh}
    >
      <div className="flex items-center space-x-1">
        {isAnyRefreshing ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          statusInfo.icon
        )}
        {enableUserStatusRefresh && !isAnyRefreshing && (
          <User className="w-2 h-2 opacity-60" />
        )}
        {showText && <span className="text-xs">{statusInfo.text}</span>}
      </div>
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">Server Status: {statusInfo.text}</div>
            {lastChecked && (
              <div className="text-muted-foreground">
                Server checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
            {enableUserStatusRefresh && lastUserRefresh && (
              <div className="text-muted-foreground">
                User status: {lastUserRefresh.toLocaleTimeString()}
              </div>
            )}
            <div className="text-muted-foreground mt-1">
              Click to refresh {enableUserStatusRefresh ? 'server & user status' : 'server status'}
            </div>
            {enableUserStatusRefresh && (
              <div className="text-muted-foreground text-xs opacity-75">
                User refresh cooldown: {REFRESH_CONFIG.MANUAL_REFRESH_COOLDOWN / 1000}s
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ServerStatusBadge; 