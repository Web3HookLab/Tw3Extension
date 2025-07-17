/**
 * 改名历史面板组件
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { RefreshCw, User } from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'
import { RefreshButton } from '../components/common/RefreshButton'
import { ApiService } from '../services/apiService'

interface NameChangesPanelProps {
  restId: string
  twitterData?: any  // 传递的本地数据
}

export function NameChangesPanel({ restId, twitterData }: NameChangesPanelProps) {
  const [nameList, setNameList] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useSettings()

  // 初始化数据 - 使用传递的数据
  useEffect(() => {
    if (twitterData?.name_list) {
      console.log('📋 使用传递的改名历史数据:', twitterData.name_list)
      setNameList(twitterData.name_list)
      setLoading(false)
    } else {
      console.log('📋 没有传递数据，显示空状态')
      setNameList([])
      setLoading(false)
    }
  }, [twitterData, restId])

  // 刷新数据（仅用于刷新按钮）
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!restId || !forceRefresh) return

    setLoading(true)
    setError(null)

    try {
      // 刷新Twitter状态数据
      const refreshResult = await ApiService.refreshTwitterStatus(restId)
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || '刷新数据失败')
      }

      // 直接使用刷新返回的数据
      const names = refreshResult.data?.name_list || []
      setNameList(names)

      console.log('📋 改名历史数据刷新完成:', {
        restId,
        count: names.length,
        names: names
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '刷新数据失败'
      setError(errorMsg)
      console.error('❌ 刷新改名历史失败:', err)
    } finally {
      setLoading(false)
    }
  }, [restId])

  // 刷新处理
  const handleRefresh = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <User className="w-4 h-4 mr-2" />
          {t('sidePanel.nameChangesTitle')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{nameList.length}</Badge>
          <RefreshButton onRefresh={handleRefresh} loading={loading} />
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <RefreshButton onRefresh={handleRefresh} loading={loading} variant="default" />
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
              </div>
            ) : nameList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('sidePanel.noData')}
              </p>
            ) : (
              <div className="space-y-2">
                {nameList.map((name: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <span className="text-sm">{name}</span>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
