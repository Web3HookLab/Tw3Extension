import React, { useState, useEffect } from 'react';
import { Button } from '~src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card';
import { Label } from '~src/components/ui/label';
import { Separator } from '~src/components/ui/separator';
import { Badge } from '~src/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';

import { useSettings } from '~src/contexts/SettingsContext';
import { Storage } from '@plasmohq/storage';
import { 
  NETWORK_CONFIGS, 
  getDexPlatformsForNetwork, 
  getDefaultDexSettings,
  EVM_PLATFORMS,
  EVM_CHAINS,
  type DexPlatformSettings
} from 'src/types/dexPlatforms.types';

interface DexPlatformSettingsStepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function DexPlatformSettingsStep({ onNext, onPrev }: DexPlatformSettingsStepProps) {
  const {t} = useSettings()
  const [dexSettings, setDexSettings] = useState<DexPlatformSettings>(getDefaultDexSettings());
  const [isLoading, setIsLoading] = useState(false);
  const storage = new Storage({ area: 'local' });

  useEffect(() => {
    initializeDexSettings();
  }, []);

  const initializeDexSettings = async () => {
    try {
      console.log('⚙️ 初始化DEX平台设置...');
      
      // 优先尝试新格式，然后尝试旧格式并迁移
      let existingSettings = await storage.get('dex_platform_settings');
      if (!existingSettings) {
        setDexSettings(getDefaultDexSettings());
      }
    } catch (error) {
      console.error('❌ 初始化DEX设置失败:', error);
      // 使用默认设置
    }
  };

  const handleDexChange = async (networkId: string, dexId: string) => {
    console.log('🔄 更新DEX设置:', networkId, '->', dexId);
    
    let newSettings: DexPlatformSettings;
    
    if (networkId === 'evm') {
      // EVM网络需要特殊处理，因为它有平台和链的概念
      // 这里我们假设dexId是平台ID，使用默认链
      newSettings = {
        ...dexSettings,
        evm: {
          platform: dexId,
          defaultChain: dexSettings.evm.defaultChain || 'ethereum'
        }
      };
    } else {
      newSettings = {
        ...dexSettings,
        [networkId]: dexId
      };
    }
    
    setDexSettings(newSettings);
    
    try {
      await storage.set('dex_platform_settings', newSettings);
      console.log('✅ DEX设置已保存');
    } catch (error) {
      console.error('❌ 保存DEX设置失败:', error);
    }
  };

  const handleEvmPlatformChange = async (platform: string) => {
    console.log('🔄 更新EVM平台设置:', platform);
    
    const newSettings = {
      ...dexSettings,
      evm: {
        ...dexSettings.evm,
        platform
      }
    };
    
    setDexSettings(newSettings);
    
    try {
      await storage.set('dex_platform_settings', newSettings);
      console.log('✅ EVM平台设置已保存');
    } catch (error) {
      console.error('❌ 保存EVM平台设置失败:', error);
    }
  };

  const handleEvmChainChange = async (defaultChain: string) => {
    console.log('🔄 更新EVM默认链设置:', defaultChain);
    
    const newSettings = {
      ...dexSettings,
      evm: {
        ...dexSettings.evm,
        defaultChain
      }
    };
    
    setDexSettings(newSettings);
    
    try {
      await storage.set('dex_platform_settings', newSettings);
      console.log('✅ EVM默认链设置已保存');
    } catch (error) {
      console.error('❌ 保存EVM默认链设置失败:', error);
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // 确保设置已保存到新格式
      await storage.set('dex_platform_settings', dexSettings);
      console.log('✅ 最终DEX设置已保存:', dexSettings);
      onNext();
    } catch (error) {
      console.error('❌ 保存设置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkDisplayName = (networkId: string) => {
    const network = NETWORK_CONFIGS.find(n => n.id === networkId);
    return network ? network.name : networkId;
  };

  const getNetworkIcon = (networkId: string) => {
    const icons = {
      evm: '🔗',
      solana: '🌟',
      sui: '🌊'
    };
    return icons[networkId] || '🔗';
  };

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('login.dexPlatformSettings') || 'DEX平台设置'}</h2>
        <p className="text-muted-foreground">
          {t('login.dexPlatformSettingsDescription') || '为每个网络选择默认的DEX平台，用于快速跳转交易'}
        </p>
      </div>

      {/* 设置卡片 */}
      <div className="space-y-4">
        {NETWORK_CONFIGS.map((network) => {
          if (network.id === 'evm') {
            // EVM网络特殊处理：显示平台和链选择
            const evmSettings = dexSettings.evm;
            
            return (
              <Card key={network.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{getNetworkIcon(network.id)}</span>
                    {getNetworkDisplayName(network.id)}
                    <Badge variant="secondary" className="ml-auto">
                      {EVM_PLATFORMS.length} {t('login.platformsAvailable') || '个平台'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {t('login.evmNetworkDesc') || '包括 Ethereum、Base、BSC 等网络'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* EVM平台选择 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('login.dexPlatform') || 'DEX平台'}
                      </Label>
                      <Select
                        value={evmSettings.platform}
                        onValueChange={(value) => handleEvmPlatformChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('login.selectDexPlatform') || '选择DEX平台'} />
                        </SelectTrigger>
                        <SelectContent>
                          {EVM_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={platform.icon} 
                                  alt={platform.name}
                                  className="h-4 w-4"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                {platform.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* EVM默认链选择 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('login.defaultChain') || '默认链'}
                      </Label>
                      <Select
                        value={evmSettings.defaultChain}
                        onValueChange={(value) => handleEvmChainChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('login.selectChain') || '选择链'} />
                        </SelectTrigger>
                        <SelectContent>
                          {EVM_CHAINS.map((chain) => (
                            <SelectItem key={chain.id} value={chain.id}>
                              {chain.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* 当前设置显示 */}
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                      {t('login.currentSettings') || '当前设置'}: {EVM_PLATFORMS.find(p => p.id === evmSettings.platform)?.name || '未知平台'} - {EVM_CHAINS.find(c => c.id === evmSettings.defaultChain)?.displayName || '未知链'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } else {
            // 非EVM网络的常规处理
            const platforms = getDexPlatformsForNetwork(network.id);
            const currentDex = dexSettings[network.id as keyof DexPlatformSettings];
            
            return (
              <Card key={network.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{getNetworkIcon(network.id)}</span>
                    {getNetworkDisplayName(network.id)}
                    <Badge variant="secondary" className="ml-auto">
                      {platforms.length} {t('login.platformsAvailable') || '个平台'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {network.id === 'solana' && (t('login.solanaNetworkDesc') || 'Solana 生态系统')}
                    {network.id === 'sui' && (t('login.suiNetworkDesc') || 'Sui 区块链网络')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label htmlFor={`dex-${network.id}`} className="text-sm font-medium">
                      {t('login.defaultDexPlatform') || '默认DEX平台'}
                    </Label>
                    <Select
                      value={currentDex as string}
                      onValueChange={(value) => handleDexChange(network.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('login.selectDexPlatform') || '选择DEX平台'} />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={platform.icon} 
                                alt={platform.name}
                                className="h-4 w-4"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* 显示当前选择的平台信息 */}
                    {currentDex && (
                      <div className="text-xs text-muted-foreground">
                        {t('login.selectedPlatform') || '已选择'}: {platforms.find(p => p.id === currentDex)?.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>

      {/* 功能说明 */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">{t('login.dexSettingsNote') || '设置说明'}</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">ℹ️</span>
                <span>{t('login.dexSettingsNote1') || 'EVM网络将显示多个平台选项，其他网络使用默认平台'}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">ℹ️</span>
                <span>{t('login.dexSettingsNote2') || '可以随时在设置中修改这些偏好'}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">ℹ️</span>
                <span>{t('login.dexSettingsNote3') || '这些设置将用于钱包地址检测和区块浏览器注入功能'}</span>
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
          {t('common.previous') || '上一步'}
        </Button>
        <Button 
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (t('common.saving') || '保存中...') : (t('common.next') || '下一步')}
        </Button>
      </div>
    </div>
  );
} 