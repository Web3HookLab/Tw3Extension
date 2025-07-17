/**
 * 钱包备注侧边栏组件
 * 用于添加、编辑和删除钱包备注
 */

import React, { useState, useEffect } from 'react'
import { sendToBackground } from '@plasmohq/messaging'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Button } from '~src/components/ui/button'
import { Input } from '~src/components/ui/input'
import { Textarea } from '~src/components/ui/textarea'
import { Label } from '~src/components/ui/label'
import { Badge } from '~src/components/ui/badge'
import { Loader2, ExternalLink, Copy, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useSettings } from '~src/contexts/SettingsContext'
import type { WalletNote } from '~src/types/wallet-notes.types'

interface WalletNotesData {
  walletAddress: string
  networkType: string
  existingNote?: WalletNote | null
}

interface WalletNotesPanelProps {
  data: WalletNotesData
}

export function WalletNotesPanel({ data }: WalletNotesPanelProps) {
  const { t } = useSettings()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!data.existingNote)
  const [currentNote, setCurrentNote] = useState<WalletNote | null>(data.existingNote || null)
  
  const [formData, setFormData] = useState({
    note: data.existingNote?.note || '',
    source: data.existingNote?.source || 'Twitter'
  })

  const { walletAddress, networkType } = data

  useEffect(() => {
    console.log('🔄 钱包备注侧边栏初始化:', { walletAddress, networkType, hasExistingNote: !!data.existingNote })
  }, [])

  /**
   * 获取网络显示名称
   */
  const getNetworkDisplayName = (network: string): string => {
    const networkNames = {
      evm: 'EVM',
      solana: 'Solana',
      sui: 'Sui'
    }
    return networkNames[network as keyof typeof networkNames] || network
  }

  /**
   * 获取网络颜色
   */
  const getNetworkColors = (network: string) => {
    const networkColors = {
      evm: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      solana: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      sui: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' }
    }
    return networkColors[network as keyof typeof networkColors] || 
           { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  }

  /**
   * 获取区块浏览器URL
   */
  const getExplorerUrl = (address: string, network: string): string => {
    const explorerUrls = {
      evm: `https://etherscan.io/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
      sui: `https://suivision.xyz/account/${address}`
    }
    return explorerUrls[network as keyof typeof explorerUrls] || ''
  }

  /**
   * 缩短地址显示
   */
  const shortenAddress = (address: string): string => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  /**
   * 复制地址到剪贴板
   */
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      toast.success(t('common.copySuccess') || '已复制到剪贴板')
    } catch (error) {
      toast.error(t('common.copyFailed') || '复制失败')
    }
  }

  /**
   * 打开区块浏览器
   */
  const handleOpenExplorer = () => {
    const url = getExplorerUrl(walletAddress, networkType)
    if (url) {
      window.open(url, '_blank')
      toast.success(t('walletDetection.explorerOpened') || '已打开区块浏览器')
    }
  }

  /**
   * 保存备注
   */
  const handleSave = async () => {
    if (!formData.note.trim()) {
      toast.error(t('walletNotes.noteRequired') || '请输入备注内容')
      return
    }

    try {
      setLoading(true)

      const messageName = currentNote ? 'wallet-notes-update' : 'wallet-notes-add'
      const operationType = currentNote ? t('common.update') : t('common.add')

      console.log(`🔄 侧边栏：开始${operationType}钱包备注`, {
        walletAddress,
        networkType,
        note: formData.note,
        source: formData.source,
        messageName
      })

      const response = await sendToBackground({
        name: messageName,
        body: {
          walletAddress,
          network: networkType,
          note: formData.note,
          source: formData.source
        }
      })

      console.log(`📥 侧边栏：${operationType}钱包备注响应`, response)
      
      if (response.success) {
        console.log(`✅ 侧边栏：${operationType}钱包备注成功`)
        toast.success(t('walletNotes.saveSuccess') || '保存成功')
        setIsEditing(false)

        // 立即更新本地状态，创建新的备注对象
        const newNote: WalletNote = {
          wallet_address: walletAddress,
          network: networkType,
          note: formData.note,
          source: formData.source,
          created_at: currentNote?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('🔄 侧边栏：立即更新本地状态:', newNote)

        // 更新当前备注状态，使界面立即显示新备注
        setCurrentNote(newNote)

        // 延迟关闭侧边栏
        console.log('⏰ 侧边栏：1.5秒后关闭')
        setTimeout(() => {
          window.close()
        }, 1500)
      } else {
        console.error(`❌ 侧边栏：${operationType}钱包备注失败`, response.error)
        toast.error(response.error || t('walletNotes.saveFailed') || '保存失败')
      }
    } catch (error) {
      console.error(`❌ 侧边栏：钱包备注操作异常:`, error)
      toast.error(t('walletNotes.saveFailed') || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 删除备注
   */
  const handleDelete = async () => {
    if (!currentNote) return

    try {
      setLoading(true)

      console.log('🔄 侧边栏：开始删除钱包备注', {
        walletAddress,
        note: currentNote.note
      })

      const response = await sendToBackground({
        name: 'wallet-notes-delete',
        body: { walletAddress }
      })

      console.log('📥 侧边栏：删除钱包备注响应', response)

      if (response.success) {
        console.log('✅ 侧边栏：删除钱包备注成功')
        toast.success(t('walletNotes.deleteSuccess') || '删除成功')

        // 立即更新本地状态
        setCurrentNote(null)
        setFormData({ note: '', source: 'Twitter' })
        setIsEditing(true) // 删除后进入编辑模式

        // 延迟关闭侧边栏
        console.log('⏰ 侧边栏：1.5秒后关闭')
        setTimeout(() => {
          window.close()
        }, 1500)
      } else {
        console.error('❌ 侧边栏：删除钱包备注失败', response.error)
        toast.error(response.error || t('walletNotes.deleteFailed') || '删除失败')
      }
    } catch (error) {
      console.error('❌ 侧边栏：删除钱包备注异常:', error)
      toast.error(t('walletNotes.deleteFailed') || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const networkColors = getNetworkColors(networkType)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          {currentNote ? t('walletNotes.editNote') : t('walletNotes.addNote')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 钱包信息 */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('walletNotes.address') || '钱包地址'}
            </Label>
            <Badge 
              className={`${networkColors.bg} ${networkColors.text} ${networkColors.border}`}
            >
              {getNetworkDisplayName(networkType)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background px-2 py-1 rounded border">
              {shortenAddress(walletAddress)}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExplorer}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 备注内容 */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="note" className="text-sm font-medium">
                {t('walletNotes.note') || '备注内容'}
              </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder={t('walletNotes.notePlaceholder') || '输入备注内容...'}
                className="mt-1 min-h-[80px]"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.note.length}/500
              </div>
            </div>

            <div>
              <Label htmlFor="source" className="text-sm font-medium">
                {t('walletNotes.source') || '来源'}
              </Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Twitter"
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          currentNote && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  {t('walletNotes.note') || '备注内容'}
                </Label>
                <div className="mt-1 p-3 bg-background border rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{currentNote.note}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">
                  {t('walletNotes.source') || '来源'}
                </Label>
                <div className="mt-1">
                  <Badge variant="secondary">{currentNote.source}</Badge>
                </div>
              </div>
            </div>
          )
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={loading || !formData.note.trim()}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t('common.save') || '保存'}
              </Button>
              
              {currentNote && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      note: currentNote.note,
                      source: currentNote.source
                    })
                  }}
                  disabled={loading}
                >
                  {t('common.cancel') || '取消'}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="flex-1"
              >
                {t('common.edit') || '编辑'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete') || '删除'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
