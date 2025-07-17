import React,{ useState } from 'react';
import { useSettings } from "~src/contexts/SettingsContext";

import { useTheme } from '~src/contexts/ThemeContext';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { RadioGroup, RadioGroupItem } from '~src/components/ui/radio-group';
import { Label } from '~src/components/ui/label';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';

type Theme = "dark" | "light" | "system"

const THEME_OPTIONS = [
  { value: 'light' as Theme, label: 'Light' },
  { value: 'dark' as Theme, label: 'Dark' },
  { value: 'system' as Theme, label: 'System' }
];

interface ThemeSelectionProps {
  onNext: () => void;
  onPrev: () => void;
  onThemeChange: (theme: string) => void;
  selectedTheme?: string;
}

function ThemeSelection({ onNext, onPrev, onThemeChange, selectedTheme }: ThemeSelectionProps) {
  const { t } = useSettings();
  const { theme: currentTheme, setTheme, resolvedTheme } = useTheme();
  const [tempTheme, setTempTheme] = useState<Theme>(selectedTheme as Theme || currentTheme);

  // 处理主题选择
  const handleThemeSelect = async (newTheme: Theme) => {
    setTempTheme(newTheme);
    // 立即应用主题以便用户预览
    await setTheme(newTheme);
    onThemeChange(newTheme);
  };

  // 处理下一步
  const handleNext = () => {
    onNext();
  };

  // 获取主题图标
  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  // 获取主题描述
  const getThemeDescription = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return t('login.themeLightDesc');
      case 'dark':
        return t('login.themeDarkDesc');
      case 'system':
        return t('login.themeAutoDesc');
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Palette className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t('login.selectTheme')}</h2>
        <p className="text-muted-foreground">
          {t('login.themeDescription')}
        </p>
      </div>

      {/* 主题选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            {t('login.themeMode')}
          </CardTitle>
          <CardDescription>
            {t('login.themeHelp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={tempTheme} onValueChange={handleThemeSelect}>
            {THEME_OPTIONS.map((option) => (
              <div key={option.value} className="space-y-2">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label 
                      htmlFor={option.value} 
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {getThemeIcon(option.value)}
                        <span className="font-medium">
                          {option.value === 'system' ? t('login.themeAuto') : 
                           option.value === 'dark' ? t('login.themeDark') : 
                           t('login.themeLight')}
                        </span>
                        {tempTheme === option.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 ml-7">
                      {getThemeDescription(option.value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* 主题预览 - 重新设计 */}
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-sm font-medium mb-3 flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              {t('login.currentThemePreview')}
              <span className="ml-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {resolvedTheme === 'dark' ? '🌙 ' + t('login.themeDark') : '☀️ ' + t('login.themeLight')}
              </span>
            </div>
            
            {/* 主题色彩展示 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-full h-8 bg-background border-2 border-border rounded-md mb-2 shadow-sm"></div>
                <span className="text-xs text-muted-foreground">{t('login.background')}</span>
              </div>
              <div className="text-center">
                <div className="w-full h-8 bg-primary rounded-md mb-2 shadow-sm"></div>
                <span className="text-xs text-muted-foreground">{t('login.primaryColor')}</span>
              </div>
              <div className="text-center">
                <div className="w-full h-8 bg-muted border border-border rounded-md mb-2 shadow-sm"></div>
                <span className="text-xs text-muted-foreground">{t('login.mutedElements')}</span>
              </div>
            </div>
            
            {/* 示例按钮预览 */}
            <div className="mt-4 pt-3 border-t">
              <div className="text-xs text-muted-foreground mb-2">{t('login.buttonPreview')}:</div>
              <div className="flex space-x-2">
                <Button size="sm" className="text-xs">{t('login.primaryButton')}</Button>
                <Button size="sm" variant="outline" className="text-xs">{t('login.outlineButton')}</Button>
                <Button size="sm" variant="ghost" className="text-xs">{t('login.ghostButton')}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          {t('common.previous')}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!tempTheme}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}

export default ThemeSelection; 