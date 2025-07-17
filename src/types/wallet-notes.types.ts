// 钱包笔记相关类型定义

/**
 * 钱包笔记数据接口
 */
export interface WalletNote {
  wallet_address: string;
  network: string;
  note: string;
  source: string;
  created_at: string;
  updated_at: string;
}

/**
 * 钱包网络配置接口
 */
export interface WalletNetwork {
  key: string;
  name: string;
  regex: RegExp;
}

/**
 * 区块链浏览器配置接口
 */
export interface ExplorerConfig {
  url: (addr: string) => string;
  icon: string;
}

/**
 * 搜索筛选条件接口
 */
export interface SearchFilters {
  address: string;
  network: string;
  note: string;
  source: string;
}

/**
 * 表单数据接口
 */
export interface WalletNoteForm {
  wallet_address: string;
  network: string;
  note: string;
  source: string;
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// 组件 Props 接口定义

/**
 * 页面标题组件 Props
 */
export interface WalletNotesHeaderProps {
  onAddClick: () => void;
}

/**
 * 统计和搜索组件 Props
 */
export interface WalletNotesStatsProps {
  notes: WalletNote[];
  search: SearchFilters;
  onSearchChange: (search: SearchFilters) => void;
}

/**
 * 钱包列表组件 Props
 */
export interface WalletNotesListProps {
  notes: WalletNote[];
  loading: boolean;
  filtered: WalletNote[];
  paged: WalletNote[];
  onEdit: (note: WalletNote) => void;
  onDelete: (address: string) => void;
}

/**
 * 添加对话框组件 Props
 */
export interface WalletNotesAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WalletNoteForm;
  onFormChange: (form: WalletNoteForm) => void;
  error: string;
  loading: boolean;
  onAdd: () => void;
}

/**
 * 编辑对话框组件 Props
 */
export interface WalletNotesEditDialogProps {
  editTarget: WalletNote | null;
  onEditTargetChange: (target: WalletNote | null) => void;
  form: WalletNoteForm;
  onFormChange: (form: WalletNoteForm) => void;
  error: string;
  loading: boolean;
  onSave: () => void;
}

/**
 * 删除对话框组件 Props
 */
export interface WalletNotesDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: string | null;
  error: string;
  deleting: boolean;
  onConfirm: () => void;
}

/**
 * 分页组件 Props
 */
export interface WalletNotesPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}
