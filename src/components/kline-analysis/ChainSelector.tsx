/**
 * 链选择器组件
 * 用于在多链代币中切换不同链的 K 线数据
 */

import React from 'react';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getChainDisplayInfo } from './dataTransform';
import { useSettings } from '~src/contexts/SettingsContext';

// 链状态枚举
export type ChainStatus = 'idle' | 'loading' | 'success' | 'error';

// 链信息接口
export interface ChainInfo {
  networkId: string;
  status: ChainStatus;
  dataPoints?: number;
  error?: string;
}

// 组件 Props
export interface ChainSelectorProps {
  supportedChains: string[];
  currentChain: string;
  chainInfos: Record<string, ChainInfo>;
  onChainChange: (networkId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  supportedChains,
  currentChain,
  chainInfos,
  onChainChange,
  disabled = false,
  className = ''
}) => {
  const { t } = useSettings();

  // 如果只有一个链，不显示选择器
  if (supportedChains.length <= 1) {
    return null;
  }

  // 获取状态图标
  const getStatusIcon = (status: ChainStatus, size: number = 12) => {
    switch (status) {
      case 'loading':
        return <Loader2 className={`w-${size/4} h-${size/4} animate-spin`} />;
      case 'success':
        return <CheckCircle className={`w-${size/4} h-${size/4} text-green-500`} />;
      case 'error':
        return <XCircle className={`w-${size/4} h-${size/4} text-red-500`} />;
      default:
        return <AlertCircle className={`w-${size/4} h-${size/4} text-gray-400`} />;
    }
  };

  // 获取链按钮样式
  const getChainButtonStyle = (networkId: string, isActive: boolean) => {
    const chainInfo = chainInfos[networkId];
    const displayInfo = getChainDisplayInfo(networkId);

    let baseStyle = 'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 text-sm font-medium transform hover:scale-105';

    if (disabled) {
      baseStyle += ' opacity-50 cursor-not-allowed transform-none';
    } else if (isActive) {
      // 使用具体的颜色而不是CSS变量，避免显示为黑色
      baseStyle += ' bg-blue-500 text-white border-blue-500 shadow-lg scale-105 hover:bg-blue-600';
    } else {
      baseStyle += ' bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700';
    }

    // 根据状态添加特殊样式和动画
    if (chainInfo?.status === 'loading') {
      baseStyle += ' animate-pulse border-blue-200 bg-blue-50 text-blue-700';
    } else if (chainInfo?.status === 'error' && !isActive) {
      baseStyle += ' border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
    } else if (chainInfo?.status === 'success' && !isActive) {
      baseStyle += ' border-green-200 bg-green-50 text-green-700 hover:bg-green-100';
    }

    return baseStyle;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          {t('klineAnalysis.chainSelector.title', '选择网络')}
        </h4>
        <Badge variant="secondary" className="text-xs">
          {supportedChains.length} {t('klineAnalysis.chainSelector.chainsAvailable', '个网络')}
        </Badge>
      </div>

      {/* 链选择按钮组 */}
      <div className="grid grid-cols-2 gap-2">
        {supportedChains.map((networkId) => {
          const isActive = networkId === currentChain;
          const chainInfo = chainInfos[networkId];
          const displayInfo = getChainDisplayInfo(networkId);
          
          return (
            <Button
              key={networkId}
              variant="ghost"
              size="sm"
              onClick={() => !disabled && onChainChange(networkId)}
              disabled={disabled}
              className={getChainButtonStyle(networkId, isActive)}
            >
              {/* 链图标 */}
              <span className="text-base" style={{ color: displayInfo.color }}>
                {displayInfo.icon}
              </span>
              
              {/* 链名称 */}
              <span className="flex-1 text-left">
                {displayInfo.shortName}
              </span>
              
              {/* 状态图标 */}
              <div className="flex items-center gap-1">
                {getStatusIcon(chainInfo?.status || 'idle')}
                
                {/* 数据点数量 */}
                {chainInfo?.status === 'success' && chainInfo.dataPoints && (
                  <span className="text-xs text-muted-foreground">
                    {chainInfo.dataPoints}
                  </span>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* 当前选中链的详细信息 */}
      {currentChain && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                className="text-lg" 
                style={{ color: getChainDisplayInfo(currentChain).color }}
              >
                {getChainDisplayInfo(currentChain).icon}
              </span>
              <div>
                <div className="text-sm font-medium">
                  {getChainDisplayInfo(currentChain).name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('klineAnalysis.chainSelector.currentNetwork', '当前网络')}
                </div>
              </div>
            </div>
            
            {/* 当前链状态 */}
            <div className="flex items-center gap-2">
              {getStatusIcon(chainInfos[currentChain]?.status || 'idle', 16)}
              {chainInfos[currentChain]?.status === 'success' && chainInfos[currentChain]?.dataPoints && (
                <Badge variant="outline" className="text-xs">
                  {chainInfos[currentChain].dataPoints} {t('klineAnalysis.chainSelector.dataPoints', '数据点')}
                </Badge>
              )}
            </div>
          </div>
          
          {/* 错误信息 */}
          {chainInfos[currentChain]?.status === 'error' && chainInfos[currentChain]?.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {chainInfos[currentChain].error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
