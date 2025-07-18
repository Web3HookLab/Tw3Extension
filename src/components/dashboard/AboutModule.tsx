/**
 * About 模块组件
 * 显示应用程序的关于信息
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { Button } from '~src/components/ui/button'
import { Separator } from '~src/components/ui/separator'
import {
  Info,
  ExternalLink,
  GitBranch,
  User,
  MessageCircle,
  Code,
  Heart,
  Star,
  Globe
} from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'

export function AboutModule() {
  const { t } = useSettings()

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      {/* 主要信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('dashboard.about')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tw3Track - {t('about.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t('dashboard.author')}</label>
                </div>
                <p className="text-lg font-semibold">Web3Hook</p>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t('dashboard.version')}</label>
                </div>
                <Badge variant="secondary" className="text-sm">
                  v1.0
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t('dashboard.contact')}</label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLink('https://t.me/Tw3Track')}
                  className="justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">{t('dashboard.sourceCode')}</label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLink('https://github.com/Web3HookLab/Tw3Extension')}
                  className="justify-start"
                >
                  <GitBranch className="w-4 h-4 mr-2" />Tw3Extension
                  GitHub
                </Button>
              </div>
            </div>  
          </div>
          <Separator />
          {/* 技术信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              {t('about.technicalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">{t('about.framework')}</p>
                <p className="text-muted-foreground">{t('about.frameworkValue')}</p>
              </div>
              <div>
                <p className="font-medium mb-1">{t('about.platform')}</p>
                <p className="text-muted-foreground">{t('about.platformValue')}</p>
              </div>
              <div>
                <p className="font-medium mb-1">{t('about.uiComponents')}</p>
                <p className="text-muted-foreground">{t('about.uiComponentsValue')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 官网链接 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              {t('about.officialWebsite')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openLink('https://www.tw3track.com')}
              className="justify-start"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('about.visitWebsite')}
            </Button>
          </div>

          <Separator />

          {/* 致谢 */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{t('about.thankYouTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('about.thankYouDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
