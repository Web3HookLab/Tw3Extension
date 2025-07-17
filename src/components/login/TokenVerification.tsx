import React ,{ useState, useEffect } from 'react';
import { useSettings } from "~src/contexts/SettingsContext";

import { ApiClient, } from '~src/services/auth.service';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Badge } from '~src/components/ui/badge';
import { Separator } from '~src/components/ui/separator';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Shield, User, Calendar, Zap, AlertTriangle } from 'lucide-react';
import type { UserInfo } from '~src/types/auth.service.types';

interface TokenVerificationProps {
  token: string;
  onNext: () => void;
  onPrev: () => void;
  onVerificationSuccess: (userStatus: UserInfo) => void;
  setIsLoading: (loading: boolean) => void;
}

function TokenVerification({ 
  token, 
  onNext, 
  onPrev, 
  onVerificationSuccess, 
  setIsLoading 
}: TokenVerificationProps) {
  const { t } = useSettings();
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [userStatus, setUserStatus] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');

  // 自动开始验证
  useEffect(() => {
    if (token && verificationState === 'idle') {
      verifyToken();
    }
  }, [token]);

  // 验证token
  const verifyToken = async () => {
    setVerificationState('verifying');
    setIsLoading(true);
    setError('');

    try {
      const response = await ApiClient.verifyToken(token);
      
      if (response.code === 200) {
        setUserStatus(response.data);
        setVerificationState('success');
        // 调用成功回调函数
        onVerificationSuccess(response.data);
      } else {
        setError(response.msg || t('login.verificationFailed'));
        setVerificationState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
      setVerificationState('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 重试验证
  const retryVerification = () => {
    setVerificationState('idle');
    setTimeout(() => verifyToken(), 100);
  };

  // 渲染验证状态
  const renderVerificationStatus = () => {
    switch (verificationState) {
      case 'verifying':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('login.verifying')}</h3>
              <p className="text-muted-foreground">{t('login.verifyingWait')}</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                {t('login.verificationSuccess')}
              </h3>
              <p className="text-muted-foreground">{t('login.verificationSuccessDescription')}</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                {t('login.verificationFailed')}
              </h3>
              <p className="text-muted-foreground">{t('login.verificationFailedDescription')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t('login.tokenVerification')}</h2>
        <p className="text-muted-foreground">
          {t('login.verifyingDescription')}
        </p>
      </div>

      {/* 验证状态显示 */}
      <Card>
        <CardContent className="p-6">
          {renderVerificationStatus()}
        </CardContent>
      </Card>

      {/* 错误信息 */}
      {verificationState === 'error' && (
                  <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('login.error')}:</strong> {error}
            </AlertDescription>
          </Alert>
      )}

      {/* 用户信息显示 */}
      {verificationState === 'success' && userStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="w-5 h-5 mr-2" />
              {t('login.accountInformation')}
            </CardTitle>
            <CardDescription>
              {t('login.accountDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 用户基本信息 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('login.userId')}:</span>
              <span className="text-sm">{userStatus.user_id}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('login.plan')}:</span>
              <Badge variant="secondary">{userStatus.plan}</Badge>
            </div>

            <Separator />

            {/* 使用统计 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  {t('login.usage')}:
                </span>
                <span className="text-sm">{userStatus.used} / {userStatus.limit}</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min((userStatus.used / userStatus.limit) * 100, 100)}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* 日期信息 */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('login.expiryDate')}:
                </span>
                <span>{new Date(userStatus.expiry_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('login.nextReset')}:
                </span>
                <span>{new Date(userStatus.next_reset_date).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={verificationState === 'verifying'}>
          {t('common.previous')}
        </Button>
        
        <div className="space-x-2">
          {verificationState === 'error' && (
            <Button variant="outline" onClick={retryVerification}>
              {t('login.retry')}
            </Button>
          )}
          <Button 
            onClick={onNext}
            disabled={verificationState !== 'success'}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TokenVerification;