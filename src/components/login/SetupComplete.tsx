import React from 'react';
import { ApiClient } from '~src/services/auth.api';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Badge } from '~src/components/ui/badge';
import { CheckCircle, Sparkles, User, Palette, Globe, Shield } from 'lucide-react';
import { useSettings } from "~src/contexts/SettingsContext";

interface SetupCompleteProps {
  onComplete: () => void;
  stepData: {
    language?: string;
    token?: string;
    userInfo?: any;
    theme?: string;
    termsAccepted?: boolean;
  };
}

function SetupComplete({ onComplete, stepData }: SetupCompleteProps) {
  const {t} = useSettings()

  // 处理完成登录
  const handleComplete = async () => {
    try {
      // 保存token和用户状态（如果还没保存的话）
      if (stepData.token && stepData.userInfo) {
        await ApiClient.completeLogin(stepData.token, stepData.userInfo);
        console.log('🎉 登录流程完成成功'); // 修改为中文日志
      }
      onComplete();
    } catch (error) {
      console.error('❌ 完成登录失败:', error); // 修改为中文日志
      onComplete();
    }
  };

  // 获取配置摘要
  const getConfigSummary = () => {
    return [
      {
        icon: <Globe className="w-4 h-4" />,
        label: t('login.language'),
        value: stepData.language === 'zh' ? '中文' : 'English'
      },
      {
        icon: <Palette className="w-4 h-4" />,
        label: t('login.theme'),
        value: stepData.theme === 'auto' ? t('login.themeAuto') : 
               stepData.theme === 'dark' ? t('login.themeDark') : t('login.themeLight')
      },
      {
        icon: <User className="w-4 h-4" />,
        label: t('login.account'),
        value: stepData.userInfo?.plan || t('login.connected')
      },
      {
        icon: <Shield className="w-4 h-4" />,
        label: t('login.terms'),
        value: stepData.termsAccepted ? t('login.accepted') : t('login.pending')
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* 成功标题区域 */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
            {t('login.setupComplete')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('login.setupCompleteMessage')}
          </p>
        </div>
      </div>

      {/* 配置摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            {t('login.configurationSummary')}
          </CardTitle>
          <CardDescription>
            {t('login.configuredSettings')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {getConfigSummary().map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="text-muted-foreground">
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <Badge variant="secondary">{item.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 用户账户信息 */}
      {stepData.userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              {t('login.accountOverview')}
            </CardTitle>
            <CardDescription>
              {t('login.accountReady')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('login.userId')}</p>
                <p className="text-sm text-muted-foreground">{stepData.userInfo.user_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('login.plan')}</p>
                <Badge>{stepData.userInfo.plan}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('login.usage')}</p>
                <p className="text-sm text-muted-foreground">
                  {stepData.userInfo.used} / {stepData.userInfo.limit}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('login.status')}</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {t('login.active')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 下一步指引 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              {t('login.whatsNext')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>{t('login.clickGetStarted')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>{t('login.accessDashboard')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>{t('login.exploreFeatures')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>{t('login.changePreferences')}</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 完成按钮 */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleComplete}
          className="w-full max-w-md"
          size="lg"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {t('login.completeSetup')}
        </Button>
      </div>

      {/* 底部感谢信息 */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {t('login.thankYou')}
        </p>
      </div>
    </div>
  );
}

export default SetupComplete;