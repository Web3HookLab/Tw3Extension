// 语言类型定义
export type Language = 'zh' | 'en';

// 翻译文本类型定义
export interface TranslationKeys {
  common: {
    next: string;
    previous: string;
    cancel: string;
    confirm: string;
    save: string;
    close: string;
    loading: string;
    logout: string;
  };
  popup: {
    welcome: string;
    notLoggedIn: string;
    openLoginPage: string;
    openDashboard: string;
    userInfo: string;
  };
  login: {
    selectLanguage: string;
    enterToken: string;
    tokenPlaceholder: string;
    verifying: string;
    verificationSuccess: string;
    selectTheme: string;
    themeAuto: string;
    themeDark: string;
    themeLight: string;
    termsTitle: string;
    termsContent: string;
    agreeTerms: string;
    setupComplete: string;
    setupCompleteMessage: string;
  };
  dashboard: {
    web3Trends: string;
    twitterNotes: string;
    walletNotes: string;
    settings: string;
  };
  userStatus: {
    userId: string;
    plan: string;
    limit: string;
    used: string;
    expiryDate: string;
    nextResetDate: string;
  };
}

// 语言选项类型
export interface LanguageOption {
  value: Language;
  label: string;
}

// i18n Hook 返回类型
export interface UseI18nReturn {
  language: Language;
  changeLanguage: (newLanguage: Language) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
  translations: TranslationKeys | null;
}