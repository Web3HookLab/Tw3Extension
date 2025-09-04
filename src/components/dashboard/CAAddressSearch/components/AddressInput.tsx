/**
 * 地址输入组件
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, Copy, Clipboard } from 'lucide-react';
import { Input } from '~src/components/ui/input';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~src/components/ui/tooltip';
import { useSettings } from '~src/contexts/SettingsContext';
import type { AddressInputProps } from '~src/types/addressSearch.types';
import { getAddressDisplayName, getAddressTypeColor, extractAddressFromText } from '../utils/addressValidation';

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onSearch,
  validation,
  loading = false,
  disabled = false,
  placeholder
}) => {
  const { t } = useSettings();
  const [isFocused, setIsFocused] = useState(false);
  const [showPasteButton, setShowPasteButton] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 检查剪贴板权限
  useEffect(() => {
    const checkClipboardPermission = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          setShowPasteButton(true);
        }
      } catch (error) {
        // 忽略权限检查错误
      }
    };

    checkClipboardPermission();
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  }, [onChange]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && validation.isValid) {
      e.preventDefault();
      onSearch();
    }
  }, [loading, validation.isValid, onSearch]);

  // 处理粘贴
  const handlePaste = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        const extractedAddress = extractAddressFromText(clipboardText);
        
        if (extractedAddress) {
          onChange(extractedAddress);
          // 聚焦输入框
          inputRef.current?.focus();
        } else {
          // 如果没有提取到有效地址，直接粘贴原文本
          onChange(clipboardText.trim());
        }
      }
    } catch (error) {
      console.warn('粘贴失败:', error);
    }
  }, [onChange]);

  // 处理复制地址
  const handleCopy = useCallback(async () => {
    if (value && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        // 这里可以添加复制成功的提示
      } catch (error) {
        console.warn('复制失败:', error);
      }
    }
  }, [value]);

  // 清空输入
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // 获取验证状态图标
  const getValidationIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }

    if (!value.trim()) {
      return null;
    }

    if (validation.isValid) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }

    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  // 获取地址类型徽章
  const getAddressTypeBadge = () => {
    if (!value.trim() || validation.type === 'unknown') {
      return null;
    }

    const displayName = getAddressDisplayName(validation.type);
    const colorClass = getAddressTypeColor(validation.type);

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${colorClass} border-0`}
      >
        {displayName}
      </Badge>
    );
  };

  // 获取错误提示
  const getErrorMessage = () => {
    if (!validation.error || !value.trim()) {
      return null;
    }

    return (
      <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{t(validation.error)}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* 输入框容器 */}
        <div className="space-y-3">
          <div className={`
            relative flex items-center gap-2 p-3 border rounded-lg transition-all duration-200
            ${isFocused ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'}
            ${validation.error && value.trim() ? 'border-red-500' : ''}
            ${validation.isValid ? 'border-green-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}>
            {/* 搜索图标 */}
            <Search className="h-4 w-4 text-gray-400 shrink-0" />

            {/* 输入框 */}
            <Input
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || t('addressSearch.placeholder')}
              disabled={disabled || loading}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
            />

            {/* 地址类型徽章 */}
            {getAddressTypeBadge()}

            {/* 验证状态图标 */}
            <div className="shrink-0">
              {getValidationIcon()}
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 粘贴按钮 */}
              {showPasteButton && !value.trim() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePaste}
                      disabled={disabled || loading}
                      className="h-6 w-6 p-0"
                    >
                      <Clipboard className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('addressSearch.paste')}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* 复制按钮 */}
              {value.trim() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      disabled={disabled || loading}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('addressSearch.copy')}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* 清空按钮 */}
              {value.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled || loading}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* 搜索状态指示器 */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('addressSearch.searching')}</span>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {getErrorMessage()}

        {/* 帮助文本 */}
        {!value.trim() && !isFocused && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              {t('addressSearch.supportedFormats')}
            </div>
            <div className="text-xs text-gray-400">
              {t('addressSearch.disclaimer')}
            </div>
          </div>
        )}

        {/* 地址格式提示 */}
        {value.trim() && validation.isValid && (
          <div className="text-xs text-green-600">
            {t('addressSearch.validFormat').replace('{type}', getAddressDisplayName(validation.type))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
