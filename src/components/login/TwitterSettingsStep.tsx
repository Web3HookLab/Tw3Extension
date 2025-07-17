import React, { useState, useEffect } from 'react';
import { Button } from '~src/components/ui/button';
import { Switch } from '~src/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Label } from '~src/components/ui/label';
import { Separator } from '~src/components/ui/separator';
import { Badge } from '~src/components/ui/badge';
import { useSettings } from '~src/contexts/SettingsContext';
import { TwitterAutoQueryManager } from '~src/services/twitter.service';
import type { TwitterSettingsStepProps } from '~src/types/login.types';


export function TwitterSettingsStep({ 
  onNext, 
  onPrev, 
  onSettingsChange,
  twitterAutoQuery = true,
  twitterShowKolList = true
}: TwitterSettingsStepProps) {
  const {t} = useSettings()
  const [autoQuery, setAutoQuery] = useState(twitterAutoQuery);
  const [showKolList, setShowKolList] = useState(twitterShowKolList);
  const [isLoading, setIsLoading] = useState(false);

  // 处理自动查询设置变更
  const handleAutoQueryChange = async (enabled: boolean) => {
    setAutoQuery(enabled);
    onSettingsChange({ twitterAutoQuery: enabled, twitterShowKolList: showKolList });
    
    try {
      // 保存到本地存储
      await TwitterAutoQueryManager.setAutoQueryEnabled(enabled);
      console.log('Twitter auto query setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save Twitter auto query setting:', error);
    }
  };

  // 处理KOL列表显示设置变更
  const handleShowKolListChange = async (enabled: boolean) => {
    setShowKolList(enabled);
    onSettingsChange({ twitterAutoQuery: autoQuery, twitterShowKolList: enabled });
    
    try {
      // 保存到本地存储
      const { Storage } = await import('@plasmohq/storage');
      const storage = new Storage({ area: 'local' });
      await storage.set('twitter_show_kol_list', enabled);
      console.log('Twitter show KOL list setting saved:', enabled);
    } catch (error) {
      console.error('Failed to save Twitter show KOL list setting:', error);
    }
  };

  // 处理下一步
  const handleNext = async () => {
    setIsLoading(true);
    try {
      // 确保设置已保存
      await TwitterAutoQueryManager.setAutoQueryEnabled(autoQuery);
      onNext();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('login.twitterSettings')}</h2>
        <p className="text-muted-foreground">
          {t('login.twitterSettingsDescription')}
        </p>
      </div>

      {/* 设置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🐦</span>
            {t('login.twitterAutoQuery')}
            <Badge variant="secondary" className="ml-auto">
              {t('login.recommended')}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t('login.twitterAutoQueryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-query" className="text-sm font-medium">
                {t('login.enableAutoQuery')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('login.autoQueryExplanation')}
              </p>
            </div>
            <Switch
              id="auto-query"
              checked={autoQuery}
              onCheckedChange={handleAutoQueryChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* KOL列表显示设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥</span>
            {t('twitterDisplay.showKolList')}
          </CardTitle>
          <CardDescription>
            {t('twitterDisplay.showKolListDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="show-kol-list" className="text-sm font-medium">
                {t('twitterDisplay.showKolList')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('twitterDisplay.showKolListDesc')}
              </p>
            </div>
            <Switch
              id="show-kol-list"
              checked={showKolList}
              onCheckedChange={handleShowKolListChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* 功能说明 */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">{t('login.whatHappensNext')}</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{t('login.featureDescription1')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{t('login.featureDescription2')}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{t('login.featureDescription3')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onPrev}
          disabled={isLoading}
        >
          {t('common.previous')}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? t('common.saving') : t('common.next')}
        </Button>
      </div>
    </div>
  );
} 