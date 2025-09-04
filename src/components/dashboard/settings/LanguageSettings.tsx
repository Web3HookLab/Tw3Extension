import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Label } from '~src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';
import { Settings } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
// import { useI18n } from '~hooks/useI18n';

/**
 * 语言和主题设置组件
 */
// 修复翻译键值
export function LanguageSettings() {
  const {
    language, setLanguage,
    theme, setTheme,
    autoRefreshInterval, setAutoRefreshInterval,
    trendsCount, setTrendsCount,
    caSearchAutoUpdateInterval, setCaSearchAutoUpdateInterval
  } = useSettings();

  const { t } = useSettings();

  const TRENDS_COUNT_OPTIONS = [10, 20, 30, 40, 50];
  const AUTO_REFRESH_OPTIONS = [5, 10, 15, 30, 60];
  const CA_SEARCH_AUTO_UPDATE_OPTIONS = [
    { value: 0, label: t('settings.caSearchAutoUpdate.disabled') },
    { value: 30, label: '30 ' + t('common.seconds') },
    { value: 60, label: '1 ' + t('common.minute') + ' (' + t('settings.caSearchAutoUpdate.recommended') + ')' },
    { value: 120, label: '2 ' + t('common.minutes') },
    { value: 300, label: '5 ' + t('common.minutes') }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('settings.title')} {/* 确保这个键值存在 */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 语言设置 */}
        <div className="space-y-2">
          <Label>{t('settings.language')}</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 主题设置 */}
        <div className="space-y-2">
          <Label>{t('settings.theme')}</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
              <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
              <SelectItem value="system">{t('settings.themeSystem')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* 自动刷新间隔 */}
        <div className="space-y-2">
          <Label>{t('settings.autoRefreshInterval')}</Label>
          <Select value={autoRefreshInterval.toString()} onValueChange={(value) => setAutoRefreshInterval(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTO_REFRESH_OPTIONS.map((interval) => (
                <SelectItem key={interval} value={interval.toString()}>
                  {interval} {t('common.minute')} {/* 使用正确的翻译键 */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 趋势显示数量 */}
        <div className="space-y-2">
          <Label>{t('settings.trendsCount')}</Label>
          <Select value={trendsCount.toString()} onValueChange={(value) => setTrendsCount(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRENDS_COUNT_OPTIONS.map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count} {t('settings.items')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CA搜索自动更新间隔 */}
        <div className="space-y-2">
          <Label>{t('settings.caSearchAutoUpdate.title')}</Label>
          <Select
            value={caSearchAutoUpdateInterval.toString()}
            onValueChange={(value) => setCaSearchAutoUpdateInterval(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CA_SEARCH_AUTO_UPDATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('settings.caSearchAutoUpdate.description')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}