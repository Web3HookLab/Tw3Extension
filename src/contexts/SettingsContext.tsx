import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '@plasmohq/storage';
import { useLanguageManager } from '~src/hooks/useLanguageManager';
import type { Language } from '~src/types/i18n.types';

const storage = new Storage({ area: 'local' });

// 组合模式：SettingsContext 包含 LanguageManager
export interface SettingsContextProps {
  // 语言管理（通过组合模式集成）
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  languageLoading: boolean;

  // 其他设置
  theme: string;
  setTheme: (theme: string) => void;
  trendsCount: number;
  setTrendsCount: (n: number) => void;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (n: number) => void;
  // CA搜索自动更新间隔
  caSearchAutoUpdateInterval: number;
  setCaSearchAutoUpdateInterval: (n: number) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用组合模式：集成语言管理器
  const languageManager = useLanguageManager();
  
  // 其他设置状态
  const [theme, setThemeState] = useState('system');
  const [trendsCount, setTrendsCountState] = useState(20);
  const [autoRefreshInterval, setAutoRefreshIntervalState] = useState(15);
  const [caSearchAutoUpdateInterval, setCaSearchAutoUpdateIntervalState] = useState(60);

  // 初始化其他设置
  useEffect(() => {
    (async () => {
      try {
        console.log('🔧 SettingsContext: 开始从存储读取其他设置...');
        
        const th = await storage.get('theme');
        const tc = await storage.get('trends_count');
        const ari = await storage.get('auto_refresh_interval');
        const casaui = await storage.get('ca_search_auto_update_interval');
        
        console.log('📦 存储中的其他设置:', { th, tc, ari, casaui });

        // 设置默认值并保存到存储
        const finalTheme = th || 'system';
        const finalTrendsCount = typeof tc === 'number' ? tc : 20;
        const finalAutoRefresh = typeof ari === 'number' ? ari : 15;
        const finalCaSearchAutoUpdate = typeof casaui === 'number' ? casaui : 60;
        
        setThemeState(finalTheme);
        setTrendsCountState(finalTrendsCount);
        setAutoRefreshIntervalState(finalAutoRefresh);
        setCaSearchAutoUpdateIntervalState(finalCaSearchAutoUpdate);
        
        // 保存默认值到存储
        if (!th) {
          console.log('💾 保存默认主题设置:', finalTheme);
          storage.set('theme', finalTheme);
        }
        if (typeof tc !== 'number') {
          console.log('💾 保存默认趋势数量:', finalTrendsCount);
          storage.set('trends_count', finalTrendsCount);
        }
        if (typeof ari !== 'number') {
          console.log('💾 保存默认自动刷新间隔:', finalAutoRefresh);
          storage.set('auto_refresh_interval', finalAutoRefresh);
        }
        if (typeof casaui !== 'number') {
          console.log('💾 保存默认CA搜索自动更新间隔:', finalCaSearchAutoUpdate);
          storage.set('ca_search_auto_update_interval', finalCaSearchAutoUpdate);
        }
        
        console.log('✅ SettingsContext: 其他设置初始化完成');
      } catch (error) {
        console.error('❌ SettingsContext 其他设置初始化错误:', error);
      }
    })();
  }, []);

  // 其他设置的更新函数
  const setTheme = (th: string) => {
    console.log('💾 保存主题设置:', th);
    setThemeState(th);
    storage.set('theme', th);
  };
  
  const setTrendsCount = (n: number) => {
    console.log('💾 保存趋势数量:', n);
    setTrendsCountState(n);
    storage.set('trends_count', n);
  };
  
  const setAutoRefreshInterval = (n: number) => {
    console.log('💾 保存自动刷新间隔:', n);
    setAutoRefreshIntervalState(n);
    storage.set('auto_refresh_interval', n);
  };

  const setCaSearchAutoUpdateInterval = (n: number) => {
    console.log('💾 保存CA搜索自动更新间隔:', n);
    setCaSearchAutoUpdateIntervalState(n);
    storage.set('ca_search_auto_update_interval', n);
  };

  // 组合模式：将语言管理器的功能暴露给上层
  const contextValue: SettingsContextProps = {
    // 语言管理（来自 languageManager）
    language: languageManager.language,
    setLanguage: languageManager.changeLanguage,
    t: languageManager.t,
    languageLoading: languageManager.loading,
    
    // 其他设置
    theme,
    setTheme,
    trendsCount,
    setTrendsCount,
    autoRefreshInterval,
    setAutoRefreshInterval,
    caSearchAutoUpdateInterval,
    setCaSearchAutoUpdateInterval
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};