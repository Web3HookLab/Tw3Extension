import React,{ useState, useRef, useEffect } from 'react';
import { useSettings } from "~src/contexts/SettingsContext";
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Checkbox } from '~src/components/ui/checkbox';
import { ScrollArea } from '~src/components/ui/scroll-area';
import { Separator } from '~src/components/ui/separator';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { FileText, Shield, AlertTriangle, Check, ScrollText, Eye } from 'lucide-react';

interface TermsAgreementProps {
  onNext: () => void;
  onPrev: () => void;
  onTermsAccept: (accepted: boolean) => void;
  termsAccepted?: boolean;
}

function TermsAgreement({ onNext, onPrev, onTermsAccept, termsAccepted = false }: TermsAgreementProps) {
  const { t } = useSettings();
  const [isAccepted, setIsAccepted] = useState(termsAccepted);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 处理滚动事件
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // 计算滚动进度
    const progress = Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100);
    setScrollProgress(progress);
    
    // 检查是否滚动到底部（允许5px的误差）
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
    setHasScrolledToBottom(isAtBottom);
  };

  // 处理同意条款
  const handleAcceptChange = (checked: boolean) => {
    setIsAccepted(checked);
    onTermsAccept(checked);
  };

  // 处理下一步
  const handleNext = () => {
    if (isAccepted && hasScrolledToBottom) {
      onNext();
    }
  };

  // 检查是否可以继续
  const canProceed = isAccepted && hasScrolledToBottom;

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t('login.termsTitle')}</h2>
        <p className="text-muted-foreground">
          {t('login.termsDescription')}
        </p>
      </div>

      {/* 滚动进度提示 */}
      {!hasScrolledToBottom && (
        <Alert>
          <ScrollText className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{t('login.scrollToRead')} ({Math.round(scrollProgress)}% {t('login.readProgress')})</span>
            <div className="w-20 h-2 bg-muted rounded-full ml-2">
              <div 
                className="h-2 bg-primary rounded-full transition-all duration-300" 
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 已读完提示 */}
      {hasScrolledToBottom && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <Eye className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ✓ {t('login.readComplete')}
          </AlertDescription>
        </Alert>
      )}

      {/* 使用说明内容 - 使用Typography样式 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {t('login.termsAndPrivacy')}
          </CardTitle>
          <CardDescription>
            {t('login.termsReadCarefully')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea 
            className="h-80 w-full rounded-md border p-4"
            onScrollCapture={handleScroll}
            ref={scrollAreaRef}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* Typography 内容 */}
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                {t('login.dataPrivacySecurity')}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t('login.privacyPrinciples')}
              </p>

              <ul className="text-sm space-y-2 mb-6">
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('login.dataStoredLocally')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('login.tokensEncrypted')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('login.noPersonalInfo')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t('login.canDeleteData')}</span>
                </li>
              </ul>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold mb-3">{t('login.usageGuidelines')}</h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t('login.byUsingExtension')}
              </p>

              <ul className="text-sm space-y-2 mb-6">
                <li>• {t('login.complianceWithLaws')}</li>
                <li>• {t('login.noReverseEngineering')}</li>
                <li>• {t('login.respectRateLimits')}</li>
                <li>• {t('login.noMaliciousUse')}</li>
                <li>• {t('login.keepTokensSecure')}</li>
              </ul>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                {t('login.importantNotes')}
              </h3>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{t('login.apiUsage')}:</strong> {t('login.apiUsageDesc')}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{t('login.dataBackup')}:</strong> {t('login.dataBackupDesc')}
                </p>
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-semibold mb-3">{t('login.contactSupport')}</h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t('login.contactSupportDesc')}
              </p>

              <ul className="text-sm space-y-1 mb-6">
                {/* <li>• {t('login.extensionSettingsPage')}</li>
                <li>• {t('login.githubRepositoryIssues')}</li> */}
                <li>• {t('login.officialSupportChannels')}</li>
              </ul>

              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <p className="text-xs text-muted-foreground">
                  {t('login.lastUpdated')}: {new Date().toLocaleDateString()}<br />
                  {t('login.version')}: 1.0.0
                </p>
              </div>

              {/* 底部标记 - 用于检测滚动到底部 */}
              <div className="h-4 flex items-center justify-center">
                <div className="text-xs text-muted-foreground/50">
                  — End of Terms —
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 同意复选框 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-agreement"
              checked={isAccepted}
              onCheckedChange={handleAcceptChange}
              className="mt-1"
              disabled={!hasScrolledToBottom}
            />
            <div className="flex-1">
              <label 
                htmlFor="terms-agreement" 
                className={`text-sm font-medium cursor-pointer ${!hasScrolledToBottom ? 'text-muted-foreground' : ''}`}
              >
                {t('login.agreeTerms')}
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {!hasScrolledToBottom 
                  ? t('login.pleaseScrollFirst')
                  : t('login.termsAcknowledge')
                }
              </p>
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
          disabled={!canProceed}
          className="min-w-32"
        >
          {!hasScrolledToBottom ? (
            <>
              <ScrollText className="w-4 h-4 mr-2" />
              {t('login.readTermsFirst')}
            </>
          ) : !isAccepted ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {t('login.acceptTerms')}
            </>
          ) : (
            t('common.next')
          )}
        </Button>
      </div>
    </div>
  );
}

export default TermsAgreement; 