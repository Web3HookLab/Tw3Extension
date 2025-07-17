import React, { useState, useEffect } from 'react';
import { useSettings } from "~src/contexts/SettingsContext"
import { DataService } from '~src/services/notes.service';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Progress } from '~src/components/ui/progress';
import { CheckCircle, Database, Wifi, AlertCircle, Sparkles } from 'lucide-react';

interface DataCacheStepProps {
  onComplete: () => void;
  stepData: {
    token?: string;
    userInfo?: any;  
  };
}

function DataCacheStep({ onComplete, stepData }: DataCacheStepProps) {
  const { t } = useSettings();
  const [caching, setCaching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{
    twitter: 'pending' | 'loading' | 'success' | 'error';
    wallet: 'pending' | 'loading' | 'success' | 'error';
  }>({
    twitter: 'pending',
    wallet: 'pending'
  });
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  // 开始缓存数据
  const startCaching = async () => {
    setCaching(true);
    setProgress(5);
    setError('');

    try {
      // 验证必要参数（但不保存token）
      if (!stepData.token || !stepData.userInfo) {
        console.error('❌ 缺少必要参数:', { 
          hasToken: !!stepData.token, 
          hasUserInfo: !!stepData.userInfo 
        });
        throw new Error('缺少 token 或用户状态信息');
      }
      
      console.log('🔄 开始缓存数据，token将在流程完成后保存');
      setProgress(10);

      // 并行缓存推特和钱包数据
      const promises = [
        cacheTwitterData(),
        cacheWalletData()
      ];

      await Promise.allSettled(promises);
      setProgress(100);
      setCompleted(true);
      console.log('✅ 数据缓存完成，准备进入下一步');
    } catch (error) {
      console.error('❌ 数据缓存失败:', error);
      setError(t('login.cachingFailed'));
    } finally {
      setCaching(false);
    }
  };

  // 缓存推特数据
  const cacheTwitterData = async () => {
    try {
      setStatus(prev => ({ ...prev, twitter: 'loading' }));
      setProgress(prev => prev + 5);

      const result = await DataService.fetchTwitterNotes((progress) => {
        setProgress(prev => Math.min(prev + progress * 0.4, 90));
      }, stepData.token); // 传入临时token

      if (result.success) {
        setStatus(prev => ({ ...prev, twitter: 'success' }));
        console.log(`✅ 推特数据缓存完成: ${result.data.length} 条`);
      } else {
        setStatus(prev => ({ ...prev, twitter: 'error' }));
        console.warn('推特数据缓存失败:', result.error);
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, twitter: 'error' }));
      console.error('推特数据缓存异常:', error);
    }
  };

  // 缓存钱包数据
  const cacheWalletData = async () => {
    try {
      setStatus(prev => ({ ...prev, wallet: 'loading' }));
      setProgress(prev => prev + 5);

      const result = await DataService.fetchWalletNotes((progress) => {
        setProgress(prev => Math.min(prev + progress * 0.4, 90));
      }, stepData.token); // 传入临时token

      if (result.success) {
        setStatus(prev => ({ ...prev, wallet: 'success' }));
        console.log(`✅ 钱包数据缓存完成: ${result.data.length} 条`);
      } else {
        setStatus(prev => ({ ...prev, wallet: 'error' }));
        console.warn('钱包数据缓存失败:', result.error);
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, wallet: 'error' }));
      console.error('钱包数据缓存异常:', error);
    }
  };

  // 自动开始缓存
  useEffect(() => {
    startCaching();
  }, []);

  // 处理完成
  const handleComplete = async () => {
    onComplete();
  };

  // 获取状态图标
  const getStatusIcon = (statusType: 'pending' | 'loading' | 'success' | 'error') => {
    switch (statusType) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'loading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Database className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {completed ? t('login.cachingComplete') : t('login.cachingData')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {completed ? t('login.cachingCompleteDesc') : t('login.cachingDataDesc')}
          </p>
        </div>
      </div>

      {/* 进度显示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Wifi className="w-5 h-5 mr-2 text-primary" />
            {t('login.cachingProgress')}
          </CardTitle>
          <CardDescription>
            {t('login.cachingProgressDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 总体进度 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('login.overallProgress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 详细状态 */}
          <div className="grid grid-cols-1 gap-3 mt-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.twitter)}
                <div>
                  <div className="text-sm font-medium">{t('login.twitterData')}</div>
                  <div className="text-xs text-muted-foreground">
                    {status.twitter === 'pending' && t('login.statusPending')}
                    {status.twitter === 'loading' && t('login.statusLoading')}
                    {status.twitter === 'success' && t('login.statusSuccess')}
                    {status.twitter === 'error' && t('login.statusError')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.wallet)}
                <div>
                  <div className="text-sm font-medium">{t('login.walletData')}</div>
                  <div className="text-xs text-muted-foreground">
                    {status.wallet === 'pending' && t('login.statusPending')}
                    {status.wallet === 'loading' && t('login.statusLoading')}
                    {status.wallet === 'success' && t('login.statusSuccess')}
                    {status.wallet === 'error' && t('login.statusError')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 完成提示 */}
      {completed && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  {t('login.cachingSuccessTitle')}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  {t('login.cachingSuccessDesc')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-center pt-4">
        {completed ? (
          <Button 
            onClick={handleComplete}
            size="lg"
            className="min-w-48 h-12 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t('login.nextStep')}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('login.cachingInProgress')}
            </p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          {t('login.cachingNote')}
        </p>
      </div>
    </div>
  );
}

export default DataCacheStep;