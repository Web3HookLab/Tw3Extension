/**
 * Twitter备注管理面板组件
 * 用于在侧边栏中添加、编辑、删除Twitter备注
 */

import React, { useState, useEffect } from 'react'
import { sendToBackground } from '@plasmohq/messaging'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Button } from '~src/components/ui/button'
import { Textarea } from '~src/components/ui/textarea'
import { Badge } from '~src/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '~src/components/ui/avatar'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '~src/components/ui/dialog'
import { Alert, AlertDescription } from '~src/components/ui/alert'
import { FileText, Save, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { TwitterNote } from '~src/types/twitter-notes.types'
import { TAG_OPTIONS, TAG_COLOR_MAP } from '~src/components/dashboard/TwitterNotes/constants'
import { useSettings } from '~src/contexts/SettingsContext'

interface TwitterNotesPanelProps {
  restId: string
  userData?: TwitterNote | null
}

interface FormData {
  note: string
  tags: string[]
}

interface UserInfo {
  name: string
  screen_name: string
  profile_image_url_https: string
}

export function TwitterNotesPanel({ restId, userData }: TwitterNotesPanelProps) {
  // 多语言支持
  const { t } = useSettings()

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [currentNote, setCurrentNote] = useState<TwitterNote | null>(userData) // 当前备注状态
  const [formData, setFormData] = useState<FormData>({
    note: userData?.note || '',
    tags: userData?.tags || []
  })
  const [isEditing, setIsEditing] = useState(!userData) // 如果没有现有备注，默认进入编辑模式
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // 初始化用户信息
  useEffect(() => {
    if (currentNote) {
      // 如果有现有备注，直接使用备注中的用户信息
      setUserInfo({
        name: currentNote.name,
        screen_name: currentNote.screen_name,
        profile_image_url_https: currentNote.profile_image_url_https
      })
    } else {
      // 如果没有现有备注，尝试从本地缓存或页面获取用户信息
      fetchUserInfoFromCache()
    }
  }, [currentNote, restId])

  /**
   * 从本地缓存获取用户信息
   */
  const fetchUserInfoFromCache = async () => {
    try {
      setLoading(true)
      console.log('🔄 从本地缓存获取用户信息:', restId)

      // 1. 首先尝试从本地备注缓存中查找
      const response = await sendToBackground({
        name: 'twitter-notes-fetch',
        body: { forceRefresh: false }
      })

      if (response.success && response.data) {
        const allNotes = response.data as any[]
        const matchingNote = allNotes.find(note =>
          String(note.twitter_rest_id) === String(restId) ||
          note.screen_name?.toLowerCase() === restId.toLowerCase()
        )

        if (matchingNote) {
          console.log('✅ 从备注缓存中找到用户信息:', matchingNote)
          setUserInfo({
            name: matchingNote.name,
            screen_name: matchingNote.screen_name,
            profile_image_url_https: matchingNote.profile_image_url_https
          })
          return
        }
      }

      // 2. 尝试从Twitter数据缓存中查找
      console.log('🔄 尝试从Twitter数据缓存中查找用户信息')
      const twitterDataCacheKey = `twitter_data_cache_${restId}`
      const cachedTwitterData = await chrome.storage.local.get(twitterDataCacheKey)

      if (cachedTwitterData[twitterDataCacheKey]) {
        const cached = cachedTwitterData[twitterDataCacheKey]
        console.log('✅ 从Twitter数据缓存中找到用户信息:', cached)

        // 检查缓存数据格式 {data: {...}, timestamp: number} 或直接数据格式
        let twitterData = cached
        if (cached.data) {
          // 新格式：{data: {...}, timestamp: number}
          twitterData = cached.data
        }

        // 检查缓存数据是否有效
        if (twitterData.name && twitterData.screen_name) {
          setUserInfo({
            name: twitterData.name,
            screen_name: twitterData.screen_name,
            profile_image_url_https: twitterData.profile_image_url_https || ''
          })
          return
        }
      }

      // 3. 如果缓存中没有找到，尝试通过API获取用户信息
      console.log('🌐 缓存中未找到，尝试通过API获取用户信息')
      const apiUserInfo = await fetchUserInfoFromAPI()
      if (apiUserInfo) {
        console.log('✅ 从API获取到用户信息:', apiUserInfo)
        setUserInfo(apiUserInfo)
        return
      }

      // 4. 如果都获取不到，使用默认信息
      console.log('⚠️ 无法获取用户信息，使用默认信息')
      setUserInfo({
        name: 'Tw3Track',
        screen_name: restId,
        profile_image_url_https: ''
      })

    } catch (error) {
      console.error('❌ 获取用户信息异常:', error)
      // 使用默认信息
      setUserInfo({
        name: 'Tw3Track',
        screen_name: restId,
        profile_image_url_https: ''
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * 通过API获取用户信息
   */
  const fetchUserInfoFromAPI = async (): Promise<UserInfo | null> => {
    try {
      console.log('🌐 通过API获取用户信息:', restId)

      const response = await sendToBackground({
        name: 'twitter-status',
        body: { restId }
      })

      if (response.success && response.data) {
        const userData = response.data
        console.log('✅ 从API获取到用户信息:', userData)
        return {
          name: userData.name || '未知用户',
          screen_name: userData.screen_name || restId,
          profile_image_url_https: userData.profile_image_url_https || ''
        }
      } else {
        console.warn('⚠️ API获取用户信息失败:', response.error)
        return null
      }
    } catch (error) {
      console.error('❌ API获取用户信息异常:', error)
      return null
    }
  }

  /**
   * 处理标签切换
   */
  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  /**
   * 验证表单
   */
  const validateForm = (): string | null => {
    if (!formData.note.trim()) {
      return t('twitterNotes.validation.noteRequired')
    }
    if (formData.note.length > 500) {
      return t('twitterNotes.validation.noteTooLong')
    }
    if (!formData.tags || formData.tags.length === 0) {
      return t('twitterNotes.validation.tagRequired')
    }
    if (formData.tags.length > 10) {
      return t('twitterNotes.validation.tooManyTags')
    }
    return null
  }

  /**
   * 保存备注
   */
  const handleSave = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setLoading(true)

      const messageName = currentNote ? 'twitter-notes-update' : 'twitter-notes-add'
      const operationType = currentNote ? t('twitterNotes.update') : t('twitterNotes.add')

      console.log(`🔄 侧边栏：开始${operationType}备注`, {
        restId,
        note: formData.note,
        tags: formData.tags,
        messageName
      })

      const response = await sendToBackground({
        name: messageName,
        body: {
          restId,
          note: formData.note,
          tags: formData.tags
        }
      })

      console.log(`📥 侧边栏：${operationType}备注响应`, response)
      
      if (response.success) {
        const operationType = currentNote ? t('twitterNotes.update') : t('twitterNotes.add')
        console.log(`✅ 侧边栏：${operationType}备注成功`)
        toast.success(t('twitterNotes.saveSuccess'))
        setIsEditing(false)

        // 立即更新本地状态，创建新的备注对象
        const newNote: TwitterNote = {
          twitter_rest_id: restId,
          name: userInfo?.name || 'Tw3Track',
          screen_name: userInfo?.screen_name || restId,
          profile_image_url_https: userInfo?.profile_image_url_https || '',
          note: formData.note,
          tags: formData.tags,
          created_at: currentNote?.created_at || new Date().toISOString() // 保持原创建时间或使用新时间
        }

        console.log('🔄 侧边栏：立即更新本地状态:', newNote)

        // 更新当前备注状态，使界面立即显示新备注
        setCurrentNote(newNote)

        // 注意：缓存更新现在由background消息处理器负责，无需在这里重复处理

        // 延迟关闭侧边栏
        console.log('⏰ 侧边栏：1.5秒后关闭')
        setTimeout(() => {
          window.close()
        }, 1500)
      } else {
        const operationType = currentNote ? t('twitterNotes.update') : t('twitterNotes.add')
        console.error(`❌ 侧边栏：${operationType}备注失败`, response.error)
        toast.error(response.error || t('twitterNotes.saveFailed'))
      }
    } catch (error) {
      const operationType = currentNote ? t('twitterNotes.update') : t('twitterNotes.add')
      console.error(`❌ 侧边栏：${operationType}备注异常:`, error)
      toast.error(t('twitterNotes.saveFailed'))
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

      console.log('🔄 侧边栏：开始删除备注', {
        restId,
        note: currentNote.note,
        tags: currentNote.tags
      })

      const response = await sendToBackground({
        name: 'twitter-notes-delete',
        body: { restId }
      })

      console.log('📥 侧边栏：删除备注响应', response)

      if (response.success) {
        console.log('✅ 侧边栏：删除备注成功')
        toast.success(t('twitterNotes.deleteSuccess'))

        // 立即更新本地状态
        setCurrentNote(null)
        setFormData({ note: '', tags: [] })
        setIsEditing(true) // 删除后进入编辑模式

        // 注意：缓存更新现在由background消息处理器负责，无需在这里重复处理

        // 延迟关闭侧边栏
        console.log('⏰ 侧边栏：1.5秒后关闭')
        setTimeout(() => {
          window.close()
        }, 15000)
      } else {
        console.error('❌ 侧边栏：删除备注失败', response.error)
        toast.error(response.error || t('twitterNotes.deleteFailed'))
      }
    } catch (error) {
      console.error('❌ 侧边栏：删除备注异常:', error)
      toast.error(t('twitterNotes.deleteFailed'))
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  /**
   * 取消编辑
   */
  const handleCancel = () => {
    if (currentNote) {
      // 恢复原始数据
      setFormData({
        note: currentNote.note,
        tags: currentNote.tags
      })
      setIsEditing(false)
    } else {
      // 如果是新建，关闭侧边栏
      window.close()
    }
  }

  if (loading && !userInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {userData ? t('twitterNotes.editNote') : t('twitterNotes.addNote')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 用户信息 */}
        {userInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              {userInfo.profile_image_url_https ? (
                <AvatarImage
                  src={userInfo.profile_image_url_https}
                  alt={userInfo.name}
                />
              ) : null}
              <AvatarFallback>
                {userInfo.name?.charAt(0)?.toUpperCase() || userInfo.screen_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{userInfo.name}</div>
              <div className="text-muted-foreground text-xs">@{userInfo.screen_name}</div>
            </div>
          </div>
        )}

        {isEditing ? (
          <>
            {/* 备注编辑 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('twitterNotes.note')}</label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder={t('twitterNotes.notePlaceholder')}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {formData.note.length}/500
              </div>
            </div>

            {/* 标签选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('twitterNotes.tags')} <span className="text-red-500">*</span>
              </label>
              <ScrollArea className="h-32">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.tags.includes(tag)
                          ? TAG_COLOR_MAP[tag] || 'bg-blue-500 text-white'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        handleTagToggle(tag)
                        // 清除验证错误
                        if (validationError) {
                          setValidationError(null)
                        }
                      }}
                    >
                      {formData.tags.includes(tag) && <Check className="w-3 h-3 mr-1" />}
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
              <div className={`text-xs ${
                formData.tags.length === 0 ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {t('twitterNotes.tagsSelected').replace('{count}', formData.tags.length.toString()).replace('{max}', '10')}
                {formData.tags.length === 0 && ` (${t('twitterNotes.selectAtLeastOne')})`}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t('twitterNotes.save')}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={loading}
              >
                {t('twitterNotes.cancel')}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 备注显示 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('twitterNotes.note')}</label>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                {currentNote?.note || t('twitterNotes.noNote')}
              </div>
            </div>

            {/* 标签显示 */}
            {currentNote?.tags && currentNote.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('twitterNotes.tags')}</label>
                <div className="flex flex-wrap gap-2">
                  {currentNote.tags.map(tag => (
                    <Badge
                      key={tag}
                      className={TAG_COLOR_MAP[tag] || 'bg-gray-500 text-white'}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* 删除确认对话框 */}
    {showDeleteDialog && (
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('twitterNotes.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('twitterNotes.deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>

          {userData && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('twitterNotes.noteToDelete')}：</div>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm break-words">
                      {userData.note}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
