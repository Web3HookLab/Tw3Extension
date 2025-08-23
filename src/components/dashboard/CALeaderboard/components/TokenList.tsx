/**
 * 代币列表组件
 */

import React from 'react'
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '~src/components/ui/button'
import { Card, CardContent } from '~src/components/ui/card'
import { Alert, AlertDescription } from '~src/components/ui/alert'
import { Skeleton } from '~src/components/ui/skeleton'
import { TokenCard } from './TokenCard'
import type { TokenListProps } from '~src/types/leaderboard.types'
import { useLanguageManager } from '~src/hooks/useLanguageManager'

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  loading,
  error,
  onRetry,
  networkType = 'solana'
}) => {
  const { t } = useLanguageManager()
  // 加载状态
  if (loading && tokens.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-8 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // 错误状态
  if (error && tokens.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('caLeaderboard.loadFailed')}</h3>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 空数据状态
  if (!loading && tokens.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('caLeaderboard.noData')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('caLeaderboard.noDataDesc')}
          </p>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('caLeaderboard.refresh')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 正常数据显示
  return (
    <div className="space-y-4">
      {/* 数据统计信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>{t('caLeaderboard.foundTokens').replace('{count}', tokens.length.toString())}</span>
        </div>
        
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('caLeaderboard.updating')}</span>
          </div>
        )}
      </div>

      {/* 错误提示（有数据时的错误） */}
      {error && tokens.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('caLeaderboard.updateFailed')}: {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
              onClick={onRetry}
            >
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 代币卡片列表 */}
      <div className="grid gap-3">
        {tokens.map((token, index) => (
          <TokenCard
            key={`${token.address}-${index}`}
            token={token}
            index={index}
            networkType={networkType}
          />
        ))}
      </div>

      {/* 加载更多指示器（如果正在加载且已有数据） */}
      {loading && tokens.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>正在更新数据...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
