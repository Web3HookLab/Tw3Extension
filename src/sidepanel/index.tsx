import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { SettingsProvider, useSettings } from '~src/contexts/SettingsContext'
import { Button } from '~src/components/ui/button'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { X, RefreshCw, Clock } from 'lucide-react'


import { NameChangesPanel } from './components/NameChangesPanel'
import { ScreenNameChangesPanel } from './components/ScreenNameChangesPanel'
import { WalletAddressesPanel } from './components/WalletAddressesPanel'
import { FollowEventsPanel } from './components/FollowEventsPanel'
import { UserHistoryPanel } from './components/UserHistoryPanel'
import { TwitterNotesPanel } from './components/TwitterNotesPanel'
import { WalletNotesPanel } from './components/WalletNotesPanel'
import "~src/styles/style.css"



interface SidePanelData {
  type: 'nameChanges' | 'screenNameChanges' | 'walletAddresses' | 'followEvents' | 'userHistory' | 'twitterNotes' | 'walletNotes'
  title: string
  restId: string
  walletAddress?: string  // 钱包备注专用字段
  userData?: any  // 本地数据类型使用（nameChanges, screenNameChanges, walletAddresses, walletNotes）
}

function SidePanelApp(): React.JSX.Element {
  const [data, setData] = useState<SidePanelData | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useSettings()
  const [twitterData, setTwitterData] = useState<any | null>(null)
  const [isWaitingForData, setIsWaitingForData] = useState(false)
  
  // 使用useRef来存储当前的data值，避免闭包问题
  const dataRef = React.useRef<SidePanelData | null>(null)
  
  // 当data更新时，同步更新ref
  React.useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    console.log('🚀 Starting sidePanel initialization...')
    setLoading(true)
    setIsWaitingForData(true)

    // 监听来自background script的消息
    const handleMessage = async (message: any, _sender: any, sendResponse: any) => {
      console.log('📥 Side panel received message:', message)

      if (message.type === 'SIDE_PANEL_DATA') {
        // 检查消息是否是发送给当前标签页的
        if (message.targetTabId) {
          try {
            const currentTab = await chrome.tabs.getCurrent()
            if (currentTab && currentTab.id !== message.targetTabId) {
              console.log('📝 消息不是发送给当前标签页的，忽略:', {
                currentTabId: currentTab.id,
                targetTabId: message.targetTabId
              })
              return
            }
          } catch (error) {
            console.warn('⚠️ 无法获取当前标签页信息，继续处理消息:', error)
          }
        }

        console.log('🔄 Processing side panel data:', message.data)

        // 设置数据
        setData(message.data)
        setIsWaitingForData(false)
        setLoading(false)

        // 根据数据类型处理
        const { type, userData } = message.data

        // 本地数据类型：直接使用传递的userData
        if (['nameChanges', 'screenNameChanges', 'walletAddresses'].includes(type)) {
          if (userData) {
            console.log('📊 Using local Twitter data:', userData)
            setTwitterData(userData)
          } else {
            console.warn('⚠️ No userData for local data type:', type)
          }
        }
        // API数据类型：将在各自的组件中处理
        else if (['followEvents', 'userHistory'].includes(type)) {
          console.log('🔄 API data type, will be handled by component:', type)
        }
        // 钱包备注类型：使用传递的userData
        else if (type === 'walletNotes') {
          console.log('💰 Wallet notes data:', userData)
        }

        // 发送确认响应
        if (sendResponse) {
          sendResponse({ success: true })
        }
      }
    }

    // 立即注册消息监听器
    chrome.runtime.onMessage.addListener(handleMessage)
    console.log('👂 侧边栏消息监听器已注册并准备就绪')

    // 通知 background script 侧边栏已准备好
    chrome.runtime.sendMessage({
      type: 'SIDE_PANEL_READY'
    }).catch(() => {
      // 忽略错误，background 可能还没准备好
      console.log('📝 侧边栏准备就绪通知已发送（或静默失败）')
    })

    // 设置超时，如果5秒内没有收到数据，则显示提示信息
    const timeoutId = setTimeout(() => {
      if (isWaitingForData) {
        console.log('⏰ 超时：5秒内未收到数据')
        setIsWaitingForData(false)
        setLoading(false)
      }
    }, 5000)

    // 清理函数
    return () => {
      clearTimeout(timeoutId)
      chrome.runtime.onMessage.removeListener(handleMessage)
      console.log('🧹 Side panel listeners cleaned up')
    }
  }, [])



  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          {t('common.loading')}
        </span>
      </div>
    </div>
  )

  if (loading) {
    return renderLoading()
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Clock className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">{t('sidePanel.waitingForData')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 头部 */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{data.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('sidePanel.userId')}: {(() => {
                // 钱包备注类型显示钱包地址
                if (data.type === 'walletNotes' && data.walletAddress) {
                  return data.walletAddress
                }
                // 其他类型显示用户名称或restId
                return data.userData?.name || data.userData?.screen_name || data.restId
              })()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.close()}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {(() => {
              switch (data.type) {
                case 'nameChanges':
                  return <NameChangesPanel restId={data.restId} twitterData={twitterData} />
                case 'screenNameChanges':
                  return <ScreenNameChangesPanel restId={data.restId} twitterData={twitterData} />
                case 'walletAddresses':
                  return <WalletAddressesPanel restId={data.restId} twitterData={twitterData} />
                case 'followEvents':
                  return <FollowEventsPanel restId={data.restId} />
                case 'userHistory':
                  return <UserHistoryPanel restId={data.restId} />
                case 'twitterNotes':
                  return <TwitterNotesPanel restId={data.restId} userData={data.userData} />
                case 'walletNotes':
                  return <WalletNotesPanel data={data.userData} />
                default:
                  return (
                    <p className="text-center text-muted-foreground py-8">
                      {t('sidePanel.noData')}
                    </p>
                  )
              }
            })()}
          </div>
        </ScrollArea>
      </div>
    </div>
  )












}

// 导出默认组件供 Plasmo 使用
export default function SidePanel() {
  return (
    <SettingsProvider>
      <SidePanelApp />
    </SettingsProvider>
  )
}

// 创建根节点（仅在直接运行时使用）
if (typeof window !== 'undefined' && document.getElementById('root')) {
  const root = document.getElementById('root')
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <SidePanel />
      </React.StrictMode>
    )
  }
}
