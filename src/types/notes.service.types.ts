// 推特备注数据接口
export interface TwitterNote {
  twitter_rest_id: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  note: string;
  tags: string[];
  created_at: string;
}

// 钱包笔记数据接口
export interface WalletNote {
  wallet_address: string;
  network: string;
  note: string;
  source: string;
  created_at: string;
  updated_at: string;
}

// 数据拉取结果接口
export interface DataFetchResult<T> {
  success: boolean;
  data: T[];
  error?: string;
  cached?: boolean; // 是否使用了缓存数据
}