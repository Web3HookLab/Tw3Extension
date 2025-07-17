import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Button } from '~src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '~src/components/ui/dialog';
import { Badge } from '~src/components/ui/badge';
import { RefreshCw, Download, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { APP_CONFIG } from '~src/config/config';
import { toast } from "sonner";
import { Storage } from '@plasmohq/storage';
import { DataService } from '~src/services/notes.service';

const storage = new Storage({
  area: 'local',
});

interface TwitterCacheStats {
  totalCount: number;
  dataCache: number;
  followChangesCache: number;
  userHistoryCache: number;
}

/**
 * 数据管理设置组件
 */
export function DataManagementSettings() {
  const { t } = useSettings();
  // 数据管理相关状态
  const [twitterRefreshDialogOpen, setTwitterRefreshDialogOpen] = useState(false);
  const [walletRefreshDialogOpen, setWalletRefreshDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // 导出确认对话框状态
  const [exportTwitterDialogOpen, setExportTwitterDialogOpen] = useState(false);
  const [exportWalletDialogOpen, setExportWalletDialogOpen] = useState(false);

  // 推特缓存管理状态
  const [twitterCacheStats, setTwitterCacheStats] = useState<TwitterCacheStats>({
    totalCount: 0,
    dataCache: 0,
    followChangesCache: 0,
    userHistoryCache: 0
  });
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // 获取推特缓存统计信息
  const getTwitterCacheStats = async (): Promise<TwitterCacheStats> => {
    try {
      const allKeys = await storage.getAll();
      const cacheKeys = Object.keys(allKeys);
      
      const dataCacheKeys = cacheKeys.filter(key => 
        key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE) && 
        !key.includes('_follow_changes_') &&
        !key.includes('_user_history_')
      );
      
      const followChangesCacheKeys = cacheKeys.filter(key => 
        key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE) && 
        key.includes('_follow_changes_')
      );

      const userHistoryCacheKeys = cacheKeys.filter(key => 
        key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE) && 
        key.includes('_user_history_')
      );

      const stats = {
        totalCount: dataCacheKeys.length + followChangesCacheKeys.length + userHistoryCacheKeys.length,
        dataCache: dataCacheKeys.length,
        followChangesCache: followChangesCacheKeys.length,
        userHistoryCache: userHistoryCacheKeys.length
      };

      return stats;
    } catch (error) {
      console.error('Error getting Twitter cache stats:', error);
      return { totalCount: 0, dataCache: 0, followChangesCache: 0, userHistoryCache: 0 };
    }
  };

  // 更新缓存统计信息
  const updateCacheStats = async () => {
    const stats = await getTwitterCacheStats();
    setTwitterCacheStats(stats);
  };

  // 组件挂载时获取缓存统计
  useEffect(() => {
    updateCacheStats();
  }, []);

  // 清除所有推特数据缓存
  const clearAllTwitterCache = async () => {
    setClearingCache(true);
    try {
      const allKeys = await storage.getAll();
      const cacheKeys = Object.keys(allKeys).filter(key => 
        key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE)
      );
      
      for (const key of cacheKeys) {
        await storage.remove(key);
      }
      
      toast.success(t('settings.cache.cleared'));
      await updateCacheStats();
    } catch (error) {
      console.error('Error clearing Twitter cache:', error);
      toast.error(t('settings.cache.clearError'));
    } finally {
      setClearingCache(false);
      setClearCacheDialogOpen(false);
    }
  };

  // 刷新推特备注数据
  const refreshTwitterNotes = async () => {
    setRefreshing(true);
    try {
      const result = await DataService.fetchTwitterNotes();
      if (result.success) {
        toast.success(t('settings.refreshTwitterSuccess'));
      } else {
        toast.error(result.error || t('settings.refreshTwitterError'));
      }
    } catch (error) {
      console.error('Error refreshing Twitter notes:', error);
      toast.error(t('settings.refreshTwitterError'));
    } finally {
      setRefreshing(false);
      setTwitterRefreshDialogOpen(false);
    }
  };

  // 刷新钱包备注数据
  const refreshWalletNotes = async () => {
    setRefreshing(true);
    try {
      const result = await DataService.fetchWalletNotes();
      if (result.success) {
        toast.success(t('settings.refreshWalletSuccess'));
      } else {
        toast.error(result.error || t('settings.refreshWalletError'));
      }
    } catch (error) {
      console.error('Error refreshing wallet notes:', error);
      toast.error(t('settings.refreshWalletError'));
    } finally {
      setRefreshing(false);
      setWalletRefreshDialogOpen(false);
    }
  };

  // 处理导出推特备注
  const handleExportTwitterNotes = async () => {
    setExportTwitterDialogOpen(true);
  };

  // 确认导出推特备注
  const confirmExportTwitterNotes = async () => {
    setExporting(true);
    try {
      await DataService.exportTwitterNotesToCSV();
      toast.success(t('settings.exportTwitterSuccess'));
    } catch (error) {
      console.error('Error exporting Twitter notes:', error);
      toast.error(t('settings.exportTwitterError'));
    } finally {
      setExporting(false);
      setExportTwitterDialogOpen(false);
    }
  };

  // 处理导出钱包备注
  const handleExportWalletNotes = async () => {
    setExportWalletDialogOpen(true);
  };

  // 确认导出钱包备注
  const confirmExportWalletNotes = async () => {
    setExporting(true);
    try {
      await DataService.exportWalletNotesToCSV();
      toast.success(t('settings.exportWalletSuccess'));
    } catch (error) {
      console.error('Error exporting wallet notes:', error);
      toast.error(t('settings.exportWalletError'));
    } finally {
      setExporting(false);
      setExportWalletDialogOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.dataManagement.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 数据刷新按钮 */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => setTwitterRefreshDialogOpen(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('settings.refreshTwitterNotes')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setWalletRefreshDialogOpen(true)}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('settings.refreshWalletNotes')}
            </Button>
          </div>

          {/* 数据导出按钮 */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleExportTwitterNotes}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('settings.exportTwitterNotes')}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExportWalletNotes}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('settings.exportWalletNotes')}
            </Button>
          </div>

          {/* 缓存管理 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('settings.cache.title')}</span>
              <Badge variant="secondary">
                {twitterCacheStats.totalCount} {t('settings.cache.items')}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
              <div>{t('settings.cache.dataCache')}: {twitterCacheStats.dataCache}</div>
              <div>{t('settings.cache.followChanges')}: {twitterCacheStats.followChangesCache}</div>
              <div>{t('settings.cache.userHistory')}: {twitterCacheStats.userHistoryCache}</div>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearCacheDialogOpen(true)}
              disabled={clearingCache || twitterCacheStats.totalCount === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('settings.cache.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 推特备注刷新确认对话框 */}
      <Dialog open={twitterRefreshDialogOpen} onOpenChange={setTwitterRefreshDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.refreshTwitterNotes')}</DialogTitle>
            <DialogDescription>
              {t('settings.refreshTwitterNotesDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwitterRefreshDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={refreshTwitterNotes} disabled={refreshing}>
              {refreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 钱包备注刷新确认对话框 */}
      <Dialog open={walletRefreshDialogOpen} onOpenChange={setWalletRefreshDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.refreshWalletNotes')}</DialogTitle>
            <DialogDescription>
              {t('settings.refreshWalletNotesDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletRefreshDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={refreshWalletNotes} disabled={refreshing}>
              {refreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出推特备注确认对话框 */}
      <Dialog open={exportTwitterDialogOpen} onOpenChange={setExportTwitterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.exportTwitterNotes')}</DialogTitle>
            <DialogDescription>
              {t('settings.exportTwitterNotesDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportTwitterDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmExportTwitterNotes} disabled={exporting}>
              {exporting && <Download className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.export')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出钱包备注确认对话框 */}
      <Dialog open={exportWalletDialogOpen} onOpenChange={setExportWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.exportWalletNotes')}</DialogTitle>
            <DialogDescription>
              {t('settings.exportWalletNotesDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportWalletDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmExportWalletNotes} disabled={exporting}>
              {exporting && <Download className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.export')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清除缓存确认对话框 */}
      <Dialog open={clearCacheDialogOpen} onOpenChange={setClearCacheDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('settings.cache.clearConfirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.cache.clearConfirmDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearCacheDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={clearAllTwitterCache} disabled={clearingCache}>
              {clearingCache && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.cache.clear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 