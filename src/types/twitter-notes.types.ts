// Twitter 备注相关类型定义

/**
 * Twitter 备注数据接口
 */
export interface TwitterNote {
  twitter_rest_id: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  note: string;
  tags: string[];
  created_at: string;
}

/**
 * 搜索筛选条件接口
 */
export interface SearchFilters {
  search: string;
  tagFilter: string[];
}

/**
 * 编辑表单数据接口
 */
export interface EditForm {
  note: string;
  tags: string[];
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

/**
 * Twitter Notes 头部组件 Props
 */
export interface TwitterNotesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  tagFilter: string[];
  onTagFilterChange: (tags: string[]) => void;
  onRefresh: () => void;
  loading: boolean;
}

/**
 * Twitter Notes 统计组件 Props
 */
export interface TwitterNotesStatsProps {
  total: number;
  filtered: number;
  loading: boolean;
}

/**
 * Twitter Notes 列表组件 Props
 */
export interface TwitterNotesListProps {
  notes: TwitterNote[];
  loading: boolean;
  error: string;
  onEdit: (note: TwitterNote) => void;
  onDelete: (note: TwitterNote) => void;
}

/**
 * Twitter Notes 编辑对话框 Props
 */
export interface TwitterNotesEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: TwitterNote | null;
  editForm: EditForm;
  onFormChange: (form: EditForm) => void;
  onSave: () => void;
  loading: boolean;
}

/**
 * Twitter Notes 删除对话框 Props
 */
export interface TwitterNotesDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: TwitterNote | null;
  onConfirm: () => void;
  loading: boolean;
}

/**
 * Twitter Notes 分页组件 Props
 */
export interface TwitterNotesPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * API 响应接口
 */
export interface TwitterNotesApiResponse {
  code: number;
  msg: string;
  data: {
    data: TwitterNote[];
    has_more: boolean;
  };
}
