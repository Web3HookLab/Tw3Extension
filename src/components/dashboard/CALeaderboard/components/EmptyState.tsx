/**
 * 空状态组件
 */

import React from 'react'
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '~src/components/ui/button'
import { Card, CardContent } from '~src/components/ui/card'
import { useLanguageManager } from '~src/hooks/useLanguageManager'

interface EmptyStateProps {
  type: 'no-data' | 'error' | 'loading'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction
}) => {
  const { t } = useLanguageManager()
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500" />
      case 'loading':
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
      case 'no-data':
      default:
        return <TrendingUp className="w-16 h-16 text-muted-foreground" />
    }
  }

  const getDefaultContent = () => {
    switch (type) {
      case 'error':
        return {
          title: title || t('caLeaderboard.loadFailed'),
          description: description || t('caLeaderboard.networkError'),
          actionLabel: actionLabel || t('common.retry')
        }
      case 'loading':
        return {
          title: title || t('caLeaderboard.loading'),
          description: description || t('caLeaderboard.loadingData'),
          actionLabel: actionLabel || ''
        }
      case 'no-data':
      default:
        return {
          title: title || t('caLeaderboard.noData'),
          description: description || t('caLeaderboard.noDataDesc'),
          actionLabel: actionLabel || t('caLeaderboard.refresh')
        }
    }
  }

  const content = getDefaultContent()

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          {getIcon()}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            <p className="text-muted-foreground max-w-md">
              {content.description}
            </p>
          </div>

          {content.actionLabel && onAction && (
            <Button onClick={onAction} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              {content.actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
