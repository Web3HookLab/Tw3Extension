import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { API_CONFIG } from '~src/config/config';
import { useSettings } from "~src/contexts/SettingsContext";

// 接口定义
interface ServerStatusCheckProps {
  onNext: () => void;
}

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

// 服务端状态枚举
enum ServerStatus {
  CHECKING = 'checking',
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error'
}

// 常量配置
const CONSTANTS = {
  AUTO_NEXT_DELAY: 1000,
  RETRY_DELAY: 500,
} as const;

// 状态配置映射
const STATUS_CONFIG = {
  [ServerStatus.CHECKING]: {
    icon: Loader2,
    iconProps: { className: "w-8 h-8 animate-spin text-blue-500" },
    titleKey: 'serverCheck.checking',
    descriptionKey: 'serverCheck.checkingDescription'
  },
  [ServerStatus.ONLINE]: {
    icon: CheckCircle,
    iconProps: { className: "w-8 h-8 text-green-500" },
    titleKey: 'serverCheck.online',
    descriptionKey: 'serverCheck.onlineDescription'
  },
  [ServerStatus.OFFLINE]: {
    icon: XCircle,
    iconProps: { className: "w-8 h-8 text-red-500" },
    titleKey: 'serverCheck.offline',
    descriptionKey: 'serverCheck.offlineDescription'
  },
  [ServerStatus.ERROR]: {
    icon: XCircle,
    iconProps: { className: "w-8 h-8 text-red-500" },
    titleKey: 'serverCheck.error',
    descriptionKey: 'serverCheck.errorDescription'
  }
} as const;

// 自定义 Hook：服务器状态检查
const useServerStatusCheck = (onNext: () => void) => {
  const [status, setStatus] = useState<ServerStatus>(ServerStatus.CHECKING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  // 检查服务端状态
  const checkServerStatus = useCallback(async () => {
    try {
      setStatus(ServerStatus.CHECKING);
      setErrorMessage('');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.HEALTH_CHECK}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tw3Track-Extension/1.0',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 解析响应内容
      let responseData: HealthCheckResponse;
      try {
        responseData = await response.json() as HealthCheckResponse;
      } catch (jsonError) {
        setStatus(ServerStatus.ERROR);
        setErrorMessage(`Invalid JSON response from server (HTTP ${response.status})`);
        return;
      }

      // 验证响应格式和内容
      if (responseData.code === 200 && responseData.msg === "server online") {
        setStatus(ServerStatus.ONLINE);
        // 可选：显示响应时间
        if (responseData.data?.response_time_ms) {
          console.log(`✅ Server online - Response time: ${responseData.data.response_time_ms}ms`);
        }
        // 自动进入下一步
        setTimeout(() => {
          onNext();
        }, CONSTANTS.AUTO_NEXT_DELAY);
      } else {
        setStatus(ServerStatus.OFFLINE);
        setErrorMessage(
          `Server status check failed: code=${responseData.code || 'unknown'}, msg="${responseData.msg || 'unknown'}"`
        );
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setStatus(ServerStatus.ERROR);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setErrorMessage('Request timeout - server may be down');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Unknown error occurred');
      }
    }
  }, [onNext]);

  // 重试检查
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, CONSTANTS.RETRY_DELAY));
    await checkServerStatus();
    setIsRetrying(false);
  }, [checkServerStatus]);

  // 初始化检查
  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  return {
    status,
    errorMessage,
    isRetrying,
    handleRetry,
    checkServerStatus
  };
};

// 状态显示组件
const StatusDisplay: React.FC<{ status: ServerStatus; t: (key: string) => string }> = ({ status, t }) => {
  const config = STATUS_CONFIG[status];
  const IconComponent = config.icon;

  return (
    <>
      <div className="flex justify-center mb-4">
        <IconComponent {...config.iconProps} />
      </div>
      <CardTitle className="text-xl">
        {t(config.titleKey)}
      </CardTitle>
      <CardDescription>
        {t(config.descriptionKey)}
      </CardDescription>
    </>
  );
};

// 错误信息组件
const ErrorAlert: React.FC<{ errorMessage: string; t: (key: string) => string }> = ({ errorMessage, t }) => (
  <Alert className="mb-4">
    <WifiOff className="h-4 w-4" />
    <AlertDescription>
      <strong>{t('serverCheck.errorDetails')}:</strong> {errorMessage}
    </AlertDescription>
  </Alert>
);

// 操作按钮组件
const ActionButtons: React.FC<{
  status: ServerStatus;
  isRetrying: boolean;
  onRetry: () => void;
  onSkip: () => void;
  t: (key: string) => string;
}> = ({ status, isRetrying, onRetry, onSkip, t }) => {
  if (status === ServerStatus.CHECKING) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('serverCheck.pleaseWait')}
      </div>
    );
  }

  if (status === ServerStatus.ONLINE) {
    return (
      <div className="flex items-center justify-center space-x-2 text-green-600">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">
          {t('serverCheck.connectionEstablished')}
        </span>
      </div>
    );
  }

  if (status === ServerStatus.OFFLINE || status === ServerStatus.ERROR) {
    return (
      <div className="space-y-3">
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full"
          variant="default"
        >
          {isRetrying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('serverCheck.retrying')}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('serverCheck.retry')}
            </>
          )}
        </Button>

        <Button
          onClick={onSkip}
          variant="outline"
          className="w-full"
        >
          {t('serverCheck.skipCheck')}
        </Button>

        {/* 帮助信息 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{t('serverCheck.troubleshootingTips')}:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('serverCheck.tip1')}</li>
            <li>{t('serverCheck.tip2')}</li>
            <li>{t('serverCheck.tip3')}</li>
          </ul>
        </div>
      </div>
    );
  }

  return null;
};

// 主组件
const ServerStatusCheck: React.FC<ServerStatusCheckProps> = ({ onNext }) => {
  const { t } = useSettings(); // 使用 useSettings 替代 useI18n
  const { status, errorMessage, isRetrying, handleRetry } = useServerStatusCheck(onNext);

  const handleSkip = useCallback(() => {
    onNext();
  }, [onNext]);

  const showError = (status === ServerStatus.OFFLINE || status === ServerStatus.ERROR) && errorMessage;

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <CardHeader>
          <StatusDisplay status={status} t={t} />
        </CardHeader>
        <CardContent>
          {/* 服务端信息 */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Server className="w-4 h-4" />
            </div>
          </div>

          {/* 错误信息 */}
          {showError && <ErrorAlert errorMessage={errorMessage} t={t} />}

          {/* 操作按钮 */}
          <div className="space-y-3">
            <ActionButtons
              status={status}
              isRetrying={isRetrying}
              onRetry={handleRetry}
              onSkip={handleSkip}
              t={t}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatusCheck;