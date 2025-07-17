import React, { useState } from "react"; // 添加 React 导入
import { LANGUAGE_OPTIONS } from 'src/lib/i18n';
import { useSettings } from '~src/contexts/SettingsContext';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';
import { Globe, Check } from 'lucide-react';
import { type Language } from '~src/types/i18n.types';

interface LanguageSelectionProps {
  onNext: () => void;
  onLanguageChange: (language: string) => void;
  selectedLanguage?: string;
}

function LanguageSelection({ onNext, onLanguageChange, selectedLanguage }: LanguageSelectionProps) {
  const { t, setLanguage, language: currentLanguage } = useSettings();
  const [tempLanguage, setTempLanguage] = useState<Language>(selectedLanguage as Language || currentLanguage);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // 处理语言选择
  const handleLanguageSelect = async (newLanguage: Language) => {
    setTempLanguage(newLanguage);
    
    try {
      setIsChangingLanguage(true);
      // 统一的语言更新
      await setLanguage(newLanguage);
      onLanguageChange(newLanguage);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // 处理下一步 - 确保语言切换完成后再进行
  const handleNext = () => {
    if (!isChangingLanguage) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t('login.selectLanguage')}</h2>
        <p className="text-muted-foreground">
          {t('login.languageDescription')}
        </p>
      </div>

      {/* 语言选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Language / 语言
          </CardTitle>
          <CardDescription>
            {t('login.languageHelp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={tempLanguage} onValueChange={handleLanguageSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('login.selectLanguagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <span>{option.label}</span>
                    {tempLanguage === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 语言预览 */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">{t('login.preview')}:</div>
            <div className="space-y-1">
              <div className="font-medium">{t('popup.welcome')}</div>
              <div className="text-sm text-muted-foreground">{t('popup.notLoggedIn')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 继续按钮 */}
      <div className="flex justify-center">
        <Button 
          onClick={handleNext}
          disabled={!tempLanguage || isChangingLanguage}
          size="lg"
          className="min-w-32"
        >
          {isChangingLanguage ? t('common.loading') : t('common.next')}
        </Button>
      </div>
    </div>
  );
}

export default LanguageSelection;