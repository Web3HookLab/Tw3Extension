import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Label } from '~src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';
import { Button } from '~src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '~src/components/ui/dialog';
import { Coins, Settings } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { toast } from "sonner";
import { Storage } from '@plasmohq/storage';
import { 
  DEX_PLATFORMS, 
  getDexPlatformsForNetwork, 
  getDefaultDexSettings,
  EVM_PLATFORMS,
  EVM_CHAINS,
  getEvmPlatformById,
  getEvmChainById,
  type DexPlatformSettings
} from '~src/types/dexPlatforms.types';

const storage = new Storage({
  area: 'local',
});

/**
 * DEX平台设置组件
 */
export function DexPlatformSettings() {
  const { t } = useSettings();

  // DEX平台设置状态
  const [dexPlatformSettings, setDexPlatformSettings] = useState<DexPlatformSettings>(getDefaultDexSettings());
  const [savingDexSettings, setSavingDexSettings] = useState(false);

  // 重置确认对话框状态
  const [resetConfirmDialogOpen, setResetConfirmDialogOpen] = useState(false);

  // 加载DEX平台设置
  const loadDexPlatformSettings = async () => {
    try {
      const savedSettings = await storage.get('dex_platform_settings') as DexPlatformSettings | null;
      // 直接使用保存的设置，如果不存在则使用默认设置
      setDexPlatformSettings(savedSettings || getDefaultDexSettings());
    } catch (error) {
      console.error('Failed to load DEX platform settings:', error);
      setDexPlatformSettings(getDefaultDexSettings());
    }
  };

  // 保存DEX平台设置
  const saveDexPlatformSettings = async (newSettings: DexPlatformSettings) => {
    setSavingDexSettings(true);
    try {
      await storage.set('dex_platform_settings', newSettings);
      setDexPlatformSettings(newSettings);
      toast.success(t('dexSettings.platformUpdated'));
    } catch (error) {
      console.error('Failed to save DEX platform settings:', error);
      toast.error(t('common.saveFailed'));
    } finally {
      setSavingDexSettings(false);
    }
  };

  // 更新单个网络的DEX平台
  const updateDexPlatform = async (network: keyof DexPlatformSettings, platformId: string) => {
    let newSettings: DexPlatformSettings;
    
    if (network === 'evm') {
      // EVM网络不应该通过这个函数更新，使用专门的函数
      console.error('Use updateEvmPlatform for EVM settings');
      return;
    } else {
      newSettings = { ...dexPlatformSettings, [network]: platformId };
    }
    
    await saveDexPlatformSettings(newSettings);
  };

  // 更新EVM平台设置
  const updateEvmPlatform = async (platform: string) => {
    const newSettings = {
      ...dexPlatformSettings,
      evm: {
        ...dexPlatformSettings.evm,
        platform
      }
    };
    await saveDexPlatformSettings(newSettings);
  };

  // 更新EVM默认链设置
  const updateEvmChain = async (defaultChain: string) => {
    const newSettings = {
      ...dexPlatformSettings,
      evm: {
        ...dexPlatformSettings.evm,
        defaultChain
      }
    };
    await saveDexPlatformSettings(newSettings);
  };

  // 组件挂载时加载DEX设置
  useEffect(() => {
    loadDexPlatformSettings();
  }, []);

  // 获取网络的可用平台
  const getNetworkPlatforms = (network: string) => {
    return getDexPlatformsForNetwork(network);
  };

  // 获取平台显示名称
  const getPlatformDisplayName = (platformId: string) => {
    const platform = DEX_PLATFORMS.find(p => p.id === platformId);
    return platform ? platform.name : platformId;
  };

  // 获取EVM平台显示名称
  const getEvmPlatformDisplayName = (platformId: string) => {
    const platform = getEvmPlatformById(platformId);
    return platform ? platform.name : platformId;
  };

  // 获取EVM链显示名称
  const getEvmChainDisplayName = (chainId: string) => {
    const chain = getEvmChainById(chainId);
    return chain ? chain.name : chainId;
  };

  // 处理重置为默认值
  const handleResetToDefault = () => {
    setResetConfirmDialogOpen(true);
  };

  // 确认重置为默认值
  const confirmResetToDefault = async () => {
    await saveDexPlatformSettings(getDefaultDexSettings());
    setResetConfirmDialogOpen(false);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {t('dexSettings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Solana DEX平台 */}
        <div className="space-y-2">
          <Label>{t('dexSettings.solana')}</Label>
          <Select 
            value={dexPlatformSettings.solana} 
            onValueChange={(value) => updateDexPlatform('solana', value)}
            disabled={savingDexSettings}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getNetworkPlatforms('solana').map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  <div className="flex items-center gap-2">
                    <img
                      src={platform.icon}
                      className="w-4 h-4"
                      alt={platform.name}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {platform.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sui DEX平台 */}
        <div className="space-y-2">
          <Label>{t('dexSettings.sui')}</Label>
          <Select 
            value={dexPlatformSettings.sui} 
            onValueChange={(value) => updateDexPlatform('sui', value)}
            disabled={savingDexSettings}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getNetworkPlatforms('sui').map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  <div className="flex items-center gap-2">
                    <img
                      src={platform.icon}
                      className="w-4 h-4"
                      alt={platform.name}
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {platform.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* EVM网络设置 */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-base font-medium">{t('dexSettings.evm')}</Label>
          
          {/* EVM平台选择 */}
          <div className="space-y-2">
            <Label className="text-sm">{t('dexSettings.evmPlatform')}</Label>
            <Select 
              value={dexPlatformSettings.evm.platform} 
              onValueChange={updateEvmPlatform}
              disabled={savingDexSettings}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVM_PLATFORMS.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    <div className="flex items-center gap-2">
                      <img
                        src={platform.icon}
                        className="w-4 h-4"
                        alt={platform.name}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
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
            <Label className="text-sm">{t('dexSettings.evmDefaultChain')}</Label>
            <Select 
              value={dexPlatformSettings.evm.defaultChain} 
              onValueChange={updateEvmChain}
              disabled={savingDexSettings}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVM_CHAINS.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 当前设置预览 */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-2 block">{t('dexSettings.currentSettings')}</Label>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Solana: {getPlatformDisplayName(dexPlatformSettings.solana)}</div>
            <div>Sui: {getPlatformDisplayName(dexPlatformSettings.sui)}</div>
            <div>EVM: {getEvmPlatformDisplayName(dexPlatformSettings.evm.platform)} ({getEvmChainDisplayName(dexPlatformSettings.evm.defaultChain)})</div>
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            disabled={savingDexSettings}
          >
            {t('dexSettings.resetToDefault')}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* 重置确认对话框 */}
    <Dialog open={resetConfirmDialogOpen} onOpenChange={setResetConfirmDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dexSettings.resetToDefault')}</DialogTitle>
          <DialogDescription>
            {t('dexSettings.resetConfirmDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{t('dexSettings.resetWarning')}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setResetConfirmDialogOpen(false)} disabled={savingDexSettings}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmResetToDefault} disabled={savingDexSettings} variant="destructive">
            {savingDexSettings ? t('common.loading') : t('dexSettings.confirmReset')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}