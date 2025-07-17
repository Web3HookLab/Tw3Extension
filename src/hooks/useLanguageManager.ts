import React, { useState, useEffect, useCallback } from 'react';
import { Storage } from '@plasmohq/storage';
import type { Language, TranslationKeys } from '~src/types/i18n.types';

const storage = new Storage({
  area: 'local',
});
const DEFAULT_LANGUAGE: Language = 'en';

// 动态导入语言文件
const loadTranslations = async (language: Language): Promise<TranslationKeys> => {
  try {
    const response = await fetch(chrome.runtime.getURL(`src/locales/${language}.json`));
    return await response.json();
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    const fallbackResponse = await fetch(chrome.runtime.getURL('src/locales/en.json'));
    return await fallbackResponse.json();
  }
};

export interface LanguageManager {
  language: Language;
  translations: TranslationKeys | null;
  loading: boolean;
  changeLanguage: (newLanguage: Language) => Promise<void>;
  t: (key: string) => string;
}

/**
 * 统一的语言管理Hook
 * 负责语言状态、翻译加载和存储管理
 */
export const useLanguageManager = (): LanguageManager => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<TranslationKeys | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化语言设置
  useEffect(() => {
    const initLanguage = async () => {
      try {
        console.log('🌐 LanguageManager: 初始化语言设置...');
        const storedLanguage = (await storage.get('language') as Language) || DEFAULT_LANGUAGE;
        
        setLanguage(storedLanguage);
        const translationData = await loadTranslations(storedLanguage);
        setTranslations(translationData);
        
        console.log('✅ LanguageManager: 语言初始化完成', storedLanguage);
      } catch (error) {
        console.error('❌ LanguageManager 初始化错误:', error);
        const fallbackTranslations = await loadTranslations(DEFAULT_LANGUAGE);
        setTranslations(fallbackTranslations);
      } finally {
        setLoading(false);
      }
    };
    
    initLanguage();
  }, []);

  // 切换语言
  const changeLanguage = useCallback(async (newLanguage: Language) => {
    // 如果语言相同，直接返回
    if (newLanguage === language) {
      return;
    }
    
    try {
      // 不设置全局loading，避免影响其他组件
      console.log('🔄 LanguageManager: 切换语言到', newLanguage);
      
      // 更新存储
      await storage.set('language', newLanguage);
      
      // 更新状态
      setLanguage(newLanguage);
      
      // 加载新的翻译
      const translationData = await loadTranslations(newLanguage);
      setTranslations(translationData);
      
      console.log('✅ LanguageManager: 语言切换完成');
    } catch (error) {
      console.error('❌ LanguageManager 语言切换错误:', error);
    }
  }, [language]);

  // 翻译函数
  const t = useCallback((key: string): string => {
    if (!translations) return key;
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value;
  }, [translations]);

  return {
    language,
    translations,
    loading,
    changeLanguage,
    t
  };
};