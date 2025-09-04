/**
 * 刷新指示器组件
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshIndicatorProps {
  refreshing?: boolean;
  className?: string;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  refreshing = false,
  className = ''
}) => {
  if (!refreshing) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    </div>
  );
};
