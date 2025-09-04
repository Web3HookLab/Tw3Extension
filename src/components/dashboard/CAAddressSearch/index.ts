/**
 * CA地址搜索模块导出文件
 */

// 主模块导出
export { CAAddressSearchModule } from './CAAddressSearchModule';

// 子组件导出
export { AddressInput } from './components/AddressInput';
export { SearchResults } from './components/SearchResults';
export { TokenInfo } from './components/TokenInfo';
export { SearchStats } from './components/SearchStats';
export { FirstMentionUser } from './components/FirstMentionUser';
export { TweetsList } from './components/TweetsList';
export { RefreshIndicator } from './components/RefreshIndicator';

// Hooks导出
export { useAddressSearch } from './hooks/useAddressSearch';
export { useAddressValidation } from './hooks/useAddressValidation';
export { useSearchHistory } from './hooks/useSearchHistory';

// 服务导出
export { AddressSearchService } from './services/addressSearch.service';

// 工具函数导出
export * from './utils/addressValidation';

// 类型导出
export type * from '~src/types/addressSearch.types';
