import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHoverPauseOptions {
  debounceDelay?: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

interface UseHoverPauseReturn {
  isHovered: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  forceUnhover: () => void;
}

export function useHoverPause(options: UseHoverPauseOptions = {}): UseHoverPauseReturn {
  const {
    debounceDelay = 200,
    onHoverStart,
    onHoverEnd
  } = options;
  
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unhoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 清理定时器
  const clearTimers = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (unhoverTimeoutRef.current) {
      clearTimeout(unhoverTimeoutRef.current);
      unhoverTimeoutRef.current = null;
    }
  }, []);
  
  // 鼠标进入处理
  const handleMouseEnter = useCallback(() => {
    clearTimers();
    
    // 立即设置悬停状态
    if (!isHovered) {
      setIsHovered(true);
      onHoverStart?.();
      console.log('🖱️ Mouse hover started - pausing updates');
    }
  }, [isHovered, onHoverStart, clearTimers]);
  
  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    clearTimers();
    
    // 延迟取消悬停状态，避免鼠标快速移动时频繁切换
    unhoverTimeoutRef.current = setTimeout(() => {
      if (isHovered) {
        setIsHovered(false);
        onHoverEnd?.();
        console.log('🖱️ Mouse hover ended - resuming updates');
      }
    }, debounceDelay);
  }, [isHovered, onHoverEnd, debounceDelay, clearTimers]);
  
  // 强制取消悬停状态
  const forceUnhover = useCallback(() => {
    clearTimers();
    if (isHovered) {
      setIsHovered(false);
      onHoverEnd?.();
      console.log('🖱️ Force unhover - resuming updates');
    }
  }, [isHovered, onHoverEnd, clearTimers]);
  
  // 清理资源
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);
  
  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave,
    forceUnhover
  };
}
