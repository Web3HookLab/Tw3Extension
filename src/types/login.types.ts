import type { UserInfo } from "./auth.service.types";

// 步骤数据接口
export interface StepData {
  language?: string;
  token?: string;
  userInfo?: UserInfo;
  theme?: string;
  termsAccepted?: boolean;
  twitterAutoQuery?: boolean;
  dexPlatformSettings?: any;
}

/**
 * Twitter设置步骤组件的属性接口
 */
export interface TwitterSettingsStepProps {
  /** 点击下一步按钮时的回调函数 */
  onNext: () => void;
  /** 点击上一步按钮时的回调函数 */
  onPrev: () => void;
  /** 设置变更时的回调函数，接收包含Twitter自动查询和KOL列表显示设置的对象 */
  onSettingsChange: (settings: { twitterAutoQuery: boolean; twitterShowKolList: boolean }) => void;
  /** Twitter自动查询功能的初始状态，默认为true */
  twitterAutoQuery?: boolean;
  /** Twitter KOL列表显示的初始状态，默认为true */
  twitterShowKolList?: boolean;
}