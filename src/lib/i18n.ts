import type { Language, LanguageOption } from '../types/i18n.types';

// 默认语言
export const DEFAULT_LANGUAGE: Language = 'en';

// 语言选项
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
];

// 兼容性Hook：重定向到 useSettings
export const useI18n = () => {
  console.warn('⚠️ useI18n is deprecated. Please use useSettings instead.');
  
  // 这里可以导入 useSettings 来保持向后兼容
  // 但建议直接使用 useSettings
  throw new Error('Please use useSettings hook instead of useI18n');
};