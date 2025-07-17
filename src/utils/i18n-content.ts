import { Storage } from '@plasmohq/storage';
import type { Language, TranslationKeys } from '~src/types/i18n.types';

/**
 * Content Script 专用的多语言工具类
 * 与 SettingsContext 保持兼容，但适用于无法使用 React hooks 的环境
 */
export class ContentI18n {
  private static instance: ContentI18n;
  private translations: TranslationKeys | null = null;
  private language: Language = 'en';
  private storage: Storage;
  private initialized = false;

  private constructor() {
    this.storage = new Storage({ area: 'local' });
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ContentI18n {
    if (!this.instance) {
      this.instance = new ContentI18n();
    }
    return this.instance;
  }

  /**
   * 初始化多语言系统
   */
  async init(): Promise<void> {
    try {
      // 从存储中获取语言设置（与 SettingsContext 使用相同的键）
      const storedLanguage = await this.storage.get('language');
      this.language = (storedLanguage as Language) || 'en';
      
      console.log('🌐 ContentI18n initializing with language:', this.language);
      
      // 加载翻译文件
      await this.loadTranslations();
      
      this.initialized = true;
      console.log('✅ ContentI18n initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing ContentI18n:', error);
      // 使用默认语言作为降级方案
      this.language = 'en';
      await this.loadTranslations();
      this.initialized = true;
    }
  }

  /**
   * 加载翻译文件
   */
  private async loadTranslations(): Promise<void> {
    try {
      // 使用 Chrome 扩展的 runtime API 获取翻译文件
      const response = await fetch(chrome.runtime.getURL(`src/locales/${this.language}.json`));
      
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`);
      }
      
      this.translations = await response.json();
      console.log(`📚 Loaded translations for language: ${this.language}`);
    } catch (error) {
      console.error(`❌ Error loading translations for ${this.language}:`, error);
      
      // 降级到英文
      if (this.language !== 'en') {
        try {
          const fallbackResponse = await fetch(chrome.runtime.getURL('src/locales/en.json'));
          this.translations = await fallbackResponse.json();
          console.log('📚 Loaded fallback English translations');
        } catch (fallbackError) {
          console.error('❌ Error loading fallback translations:', fallbackError);
          this.translations = null;
        }
      }
    }
  }

  /**
   * 获取翻译文本
   */
  t(key: string): string {
    if (!this.initialized) {
      console.warn('⚠️ ContentI18n not initialized, call init() first');
      return key;
    }

    if (!this.translations) {
      console.warn('⚠️ No translations loaded');
      return key;
    }

    try {
      // 支持嵌套键，如 "twitterDisplay.title"
      const keys = key.split('.');
      let value: any = this.translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`⚠️ Translation key not found: ${key}`);
          return key;
        }
      }
      
      if (typeof value === 'string') {
        return value;
      } else {
        console.warn(`⚠️ Translation value is not a string: ${key}`);
        return key;
      }
    } catch (error) {
      console.error(`❌ Error getting translation for key ${key}:`, error);
      return key;
    }
  }

  /**
   * 获取当前语言
   */
  getLanguage(): Language {
    return this.language;
  }

  /**
   * 切换语言
   */
  async changeLanguage(newLanguage: Language): Promise<void> {
    try {
      if (newLanguage === this.language) {
        return;
      }

      console.log(`🌐 Changing language from ${this.language} to ${newLanguage}`);
      
      // 保存到存储（与 SettingsContext 使用相同的键）
      await this.storage.set('language', newLanguage);
      
      // 更新当前语言
      this.language = newLanguage;
      
      // 重新加载翻译
      await this.loadTranslations();
      
      console.log(`✅ Language changed to ${newLanguage}`);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取所有翻译数据（用于调试）
   */
  getTranslations(): TranslationKeys | null {
    return this.translations;
  }

  /**
   * 监听语言变化（从其他组件）
   */
  onLanguageChange(callback: (language: Language) => void): () => void {
    const listener = async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.language && changes.language.newValue !== this.language) {
        const newLanguage = changes.language.newValue as Language;
        console.log('🌐 Language change detected:', newLanguage);
        
        this.language = newLanguage;
        await this.loadTranslations();
        callback(newLanguage);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    // 返回清理函数
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }
}

/**
 * 便捷函数：获取已初始化的 ContentI18n 实例
 */
export async function getContentI18n(): Promise<ContentI18n> {
  const i18n = ContentI18n.getInstance();
  
  if (!i18n.isInitialized()) {
    await i18n.init();
  }
  
  return i18n;
}

/**
 * 便捷函数：直接获取翻译文本
 */
export async function t(key: string): Promise<string> {
  const i18n = await getContentI18n();
  return i18n.t(key);
}

/**
 * 便捷函数：获取当前语言
 */
export async function getCurrentLanguage(): Promise<Language> {
  const i18n = await getContentI18n();
  return i18n.getLanguage();
}
