/**
 * 通用刷新按钮组件
 */

import React from 'react'
import { Button } from '~src/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export function RefreshButton({
  onRefresh,
  loading = false,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  className = ''
}: RefreshButtonProps) {
  const { t } = useSettings()

  const handleRefresh = async () => {
    try {
      await onRefresh()
    } catch (error) {
      console.error('❌ 刷新失败:', error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'animate-pulse' : ''}`}
      title={t('common.refresh')}
    >
      <RefreshCw 
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
      />
      {size !== 'sm' && (
        <span className="ml-2">
          {loading ? t('common.refreshing') : t('common.refresh')}
        </span>
      )}
    </Button>
  )
}
