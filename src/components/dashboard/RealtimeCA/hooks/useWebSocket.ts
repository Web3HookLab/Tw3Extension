import { useState, useEffect, useRef, useCallback } from 'react';
import { TokenManager } from "~src/services/token.service";
import { WS_CONFIG, WS_MESSAGE_TYPES } from '../constants';
import { validateCAEvent } from '../utils';
import type { 
  ConnectionStatus, 
  CAEvent, 
  RealtimeCASettings,
  SubscriptionConfig,
  WebSocketMessage 
} from '~src/types/realtime-ca.types';

interface UseWebSocketOptions {
  onMessage: (event: CAEvent) => void;
  settings: RealtimeCASettings;
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (config?: SubscriptionConfig) => void;
  unsubscribe: () => void;
  updateSubscription: (config: SubscriptionConfig) => void;
  reconnectAttempts: number;
}

export function useWebSocket({ onMessage, settings }: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnectRef = useRef(false);
  const connectFnRef = useRef<((forceConnect?: boolean) => Promise<void>) | null>(null);

  const isConnected = connectionStatus === 'connected';

  // 移除所有模拟数据相关代码
  
  // 清理定时器
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);
  
  // 发送消息
  const sendMessage = useCallback((message: any): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message:', message);
      return false;
    }
    
    try {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message.action || message.type);
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }, []);
  
  // 开始心跳
  const startHeartbeat = useCallback(() => {
    clearTimers();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ action: WS_MESSAGE_TYPES.PING });
        
        // 设置心跳超时
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.error('❌ Heartbeat timeout, closing connection');
          wsRef.current?.close();
        }, WS_CONFIG.PONG_TIMEOUT);
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }, [sendMessage, clearTimers]);
  
  // 处理心跳响应
  const handlePong = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);
  
  // 处理WebSocket消息
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message.type);
      
      switch (message.type) {
        case WS_MESSAGE_TYPES.SUBSCRIBE_SUCCESS:
          console.log('✅ Subscription successful:', message);
          break;
          
        case WS_MESSAGE_TYPES.SUBSCRIBE_ERROR:
          console.error('❌ Subscription failed:', message.error);
          break;
          
        case WS_MESSAGE_TYPES.REALTIME_CA:
          if (validateCAEvent(message)) {
            onMessage(message as CAEvent);
          } else {
            console.warn('⚠️ Invalid CA event received:', message);
          }
          break;
          
        case WS_MESSAGE_TYPES.PONG:
          handlePong();
          break;
          
        case WS_MESSAGE_TYPES.ERROR:
          console.error('❌ WebSocket error:', message.message, message.code);
          break;
          
        case WS_MESSAGE_TYPES.CLOSE:
          console.log('🔌 Server closing connection:', message.reason);
          break;
          
        default:
          console.log('❓ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error, event.data);
    }
  }, [onMessage, handlePong]);
  
  // 重连逻辑
  const attemptReconnect = useCallback(() => {
    if (!settings.autoRetry || isManualDisconnectRef.current) {
      return;
    }

    if (reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnect attempts reached');
      setConnectionStatus('error');
      return;
    }

    const delay = Math.min(
      WS_CONFIG.RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts),
      30000 // 最大30秒
    );

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
    setConnectionStatus('reconnecting');

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      // 使用ref避免循环依赖
      if (connectFnRef.current) {
        connectFnRef.current(false);
      }
    }, delay);
  }, [settings.autoRetry, reconnectAttempts]);
  
  // 连接WebSocket的实现
  const connect = useCallback(async (forceConnect = false) => {
    // 如果是手动断开状态，且不是强制连接，则拒绝连接
    if (isManualDisconnectRef.current && !forceConnect) {
      console.log('🚫 Connection blocked: manual disconnect active');
      return;
    }

    // 防止重复连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    // 如果正在连接中，不要重复连接
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket connection already in progress');
      return;
    }

    // 只有在强制连接时才重置手动断开标志
    if (forceConnect) {
      isManualDisconnectRef.current = false;
    }
    setConnectionStatus('connecting');

    try {
      // 获取token
      console.log('🔑 Getting authentication token...');
      const token = await TokenManager.getToken();
      if (!token) {
        console.error('❌ No valid token available');
        setConnectionStatus('error');
        return;
      }

      console.log('✅ Token obtained');

      // 直接建立WebSocket连接（参考原型逻辑）
      console.log('🔗 Establishing WebSocket connection...');
      const wsUrl = `${WS_CONFIG.URL}?token=${encodeURIComponent(token)}`;
      wsRef.current = new WebSocket(wsUrl);

      // 连接超时处理
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          console.error('❌ Connection timeout');
          wsRef.current.close();
          setConnectionStatus('error');
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        startHeartbeat();

        // 连接成功后立即发送订阅（参考原型逻辑）
        console.log('📡 Sending subscription...');
        subscribe(settings.subscriptionConfig);
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        clearTimers();

        console.log('🔌 WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          manual: isManualDisconnectRef.current
        });

        if (event.code === 1000 || isManualDisconnectRef.current) {
          // 正常关闭或手动断开
          setConnectionStatus('disconnected');
        } else {
          // 异常关闭，尝试重连
          setConnectionStatus('error');
          attemptReconnect();
        }
      };

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      setConnectionStatus('error');
      attemptReconnect();
    }
  }, [settings.subscriptionConfig, startHeartbeat, handleMessage, clearTimers, attemptReconnect]);

  // 将connect函数存储在ref中，避免循环依赖
  useEffect(() => {
    connectFnRef.current = connect;
  }, [connect]);

  // 断开连接 (仅处理真实WebSocket)
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearTimers();

    // 关闭真实WebSocket连接
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
    console.log('🔌 WebSocket disconnected');
  }, [clearTimers]);
  
  // 订阅CA事件 (仅真实WebSocket)
  const subscribe = useCallback((config?: SubscriptionConfig) => {
    const subscriptionConfig = config || settings.subscriptionConfig;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage(subscriptionConfig);
      console.log('📡 WebSocket subscription:', subscriptionConfig);
    } else {
      console.warn('⚠️ Cannot subscribe: WebSocket not connected');
    }
  }, [settings.subscriptionConfig, sendMessage]);

  // 取消订阅 (仅真实WebSocket)
  const unsubscribe = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({
        action: WS_MESSAGE_TYPES.UNSUBSCRIBE,
        event: 'realtime_ca'
      });
      console.log('📡 WebSocket unsubscribed');
    } else {
      console.warn('⚠️ Cannot unsubscribe: WebSocket not connected');
    }
  }, [sendMessage]);

  // 更新订阅配置 (仅真实WebSocket)
  const updateSubscription = useCallback((config: SubscriptionConfig) => {
    if (isConnected) {
      subscribe(config);
    } else {
      console.warn('⚠️ Cannot update subscription: WebSocket not connected');
    }
  }, [isConnected, subscribe]);

  // 清理资源
  useEffect(() => {
    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimers]);
  
  return {
    connectionStatus,
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    updateSubscription,
    reconnectAttempts
  };
}
