/**
 * 钱包地址列表面板组件
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { Button } from '~src/components/ui/button'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { RefreshCw, Wallet } from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'
import { RefreshButton } from '../components/common/RefreshButton'
import { ApiService } from '../services/apiService'

interface WalletAddressesPanelProps {
  restId: string
  twitterData?: any
}

// 区块链浏览器跳转配置
const explorerMap = {
  solana: {
    url: (addr: string) => `https://solscan.io/account/${addr}`,
    icon: 'https://solscan.io/_next/static/media/solana-sol-logo.ecf2bf3a.svg',
  },
  eth: {
    url: (addr: string) => `https://etherscan.io/address/${addr}`,
    icon: 'https://etherscan.io/images/brandassets/etherscan-logo-circle.svg',
  },
  ethereum: {
    url: (addr: string) => `https://etherscan.io/address/${addr}`,
    icon: 'https://etherscan.io/images/brandassets/etherscan-logo-circle.svg',
  },
  sui: {
    url: (addr: string) => `https://suivision.xyz/account/${addr}`,
    icon: 'https://suivision.xyz/favicon.svg',
  },
}

// 从explorerMap获取网络图标
const getNetworkIcon = (network: string) => {
  const networkKey = network.toLowerCase()
  const explorer = explorerMap[networkKey as keyof typeof explorerMap]
  return explorer?.icon
}

export function WalletAddressesPanel({ restId, twitterData }: WalletAddressesPanelProps) {
  const [walletList, setWalletList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useSettings()

  // 初始化数据 - 使用传递的数据
  useEffect(() => {
    if (twitterData?.wallet_address_list) {
      console.log('📋 使用传递的钱包地址数据:', twitterData.wallet_address_list)
      setWalletList(twitterData.wallet_address_list)
      setLoading(false)
    } else {
      console.log('📋 没有传递数据，显示空状态')
      setWalletList([])
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
      const wallets = refreshResult.data?.wallet_address_list || []
      setWalletList(wallets)

      console.log('📋 钱包地址数据刷新完成:', {
        restId,
        count: wallets.length,
        wallets: wallets
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '刷新数据失败'
      setError(errorMsg)
      console.error('❌ 刷新钱包地址失败:', err)
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
          <Wallet className="w-4 h-4 mr-2" />
          {t('sidePanel.walletAddressesTitle')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{walletList.length}</Badge>
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
            ) : walletList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('sidePanel.noData')}
              </p>
            ) : (
            <div className="space-y-2">
              {walletList.map((walletItem: any, index: number) => {
                // 处理两种可能的数据格式：字符串或对象
                const isObject = typeof walletItem === 'object' && walletItem !== null
                const address = isObject ? (walletItem as any).wallet_address : walletItem
                const network = isObject ? (walletItem as any).network : 'Unknown'

                return (
                  <div
                    key={index}
                    className="flex flex-col p-3 rounded-md border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {isObject && (
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getNetworkIcon(network) && (
                                <img
                                  src={getNetworkIcon(network)}
                                  alt={network}
                                  className="w-3 h-3"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              )}
                              {network}
                            </Badge>
                          </div>
                        )}
                        {/* 钱包地址，支持浏览器跳转 */}
                        {(() => {
                          const networkKey = network.toLowerCase()
                          const explorer = explorerMap[networkKey as keyof typeof explorerMap]

                          if (explorer) {
                            return (
                              <a
                                href={explorer.url(address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono break-all text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors"
                                title={`在区块链浏览器中查看: ${address}`}
                              >
                                {address}
                              </a>
                            )
                          } else {
                            return (
                              <span className="text-xs font-mono break-all text-foreground">
                                {address}
                              </span>
                            )
                          }
                        })()}
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        {/* 复制按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            navigator.clipboard.writeText(address)
                            // 简单的反馈
                            const button = event.target as HTMLElement
                            const originalText = button.textContent
                            button.textContent = t('common.copied')
                            setTimeout(() => {
                              button.textContent = originalText
                            }, 1000)
                          }}
                          className="h-6 px-2"
                          title={t('sidePanel.copyAddress')}
                        >
                          {t('common.copy')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </ScrollArea>
        )}
        {/* 钱包地址免责声明 */}
        {walletList.length > 0 && (
          <div className="text-xs text-muted-foreground text-center mt-2 px-2">
            {t('twitterDisplay.walletDisclaimer')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
