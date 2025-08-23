import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~src/components/ui/dialog';
import { Button } from '~src/components/ui/button';
import { Switch } from '~src/components/ui/switch';
import { Label } from '~src/components/ui/label';
import { Input } from '~src/components/ui/input';
import { Separator } from '~src/components/ui/separator';
import { Badge } from '~src/components/ui/badge';
import { Trash2 } from 'lucide-react';

import type { RealtimeCASettings as Settings } from '~src/types/realtime-ca.types';
import { useSettings } from '~src/contexts/SettingsContext';

interface RealtimeCASettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  cacheCount: number;
  onClearCache: () => void;
}

export function RealtimeCASettings({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  cacheCount,
  onClearCache
}: RealtimeCASettingsProps) {
  const { t } = useSettings();

  const handleSettingChange = (key: keyof Settings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('realtimeCA.settings.title')}</DialogTitle>
          <DialogDescription>
            {t('realtimeCA.settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 连接设置 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('realtimeCA.settings.connectionSettings')}</h4>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-connect" className="text-sm">
                {t('realtimeCA.settings.autoConnect')}
              </Label>
              <Switch
                id="auto-connect"
                checked={settings.autoConnect}
                onCheckedChange={(checked) => handleSettingChange('autoConnect', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-retry" className="text-sm">
                {t('realtimeCA.settings.autoRetry')}
              </Label>
              <Switch
                id="auto-retry"
                checked={settings.autoRetry}
                onCheckedChange={(checked) => handleSettingChange('autoRetry', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* 缓存设置 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('realtimeCA.settings.cacheSettings')}</h4>

            <div className="space-y-2">
              <Label htmlFor="max-cache-size" className="text-sm">
                {t('realtimeCA.settings.maxCacheSize')}
              </Label>
              <Input
                id="max-cache-size"
                type="number"
                min="100"
                max="10000"
                step="100"
                value={settings.maxCacheSize}
                onChange={(e) => handleSettingChange('maxCacheSize', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {t('realtimeCA.settings.recommendedValue')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cache-expiry" className="text-sm">
                {t('realtimeCA.settings.cacheExpiry')}
              </Label>
              <Input
                id="cache-expiry"
                type="number"
                min="1"
                max="30"
                value={settings.cacheExpiryDays}
                onChange={(e) => handleSettingChange('cacheExpiryDays', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">{t('realtimeCA.settings.currentCache')}</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {t('realtimeCA.settings.cacheRecords').replace('{count}', String(cacheCount))}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCache}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('realtimeCA.settings.clearCache')}
              </Button>
            </div>
          </div>

          <Separator />

        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('realtimeCA.settings.saveSettings')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
