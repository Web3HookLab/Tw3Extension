import { Storage } from '@plasmohq/storage';
import { TokenManager } from '~src/services/token.service';
import { DataService } from '~src/services/notes.service';
import { API_CONFIG } from '~src/config/config';
import type { TwitterNote, EditForm, SearchFilters } from '~src/types/twitter-notes.types';
import { TAG_OPTIONS, API_LIMITS } from './constants';

/**
 * 验证编辑表单数据
 */
export const validateForm = (form: EditForm, t: (key: string) => string): string | null => {
  if (!form.note.trim()) {
    return t('twitterNotes.noteEmptyError');
  }
  if (form.tags.length > TAG_OPTIONS.length) {
    return t('twitterNotes.tagLimitError');
  }
  return null;
};

/**
 * 过滤备注数据
 */
export const filterNotes = (notes: TwitterNote[], filters: SearchFilters): TwitterNote[] => {
  return notes.filter(note => {
    // 搜索过滤
    const searchMatch = !filters.search || 
      note.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      note.screen_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      note.note?.toLowerCase().includes(filters.search.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));

    // 标签过滤
    const tagMatch = filters.tagFilter.length === 0 || 
      filters.tagFilter.every(tag => note.tags.includes(tag));

    return searchMatch && tagMatch;
  });
};

/**
 * 分页处理
 */
export const paginateNotes = (notes: TwitterNote[], page: number, pageSize: number): TwitterNote[] => {
  return notes.slice((page - 1) * pageSize, page * pageSize);
};

/**
 * 更新本地缓存
 */
export const updateLocalCache = async (updatedNotes: TwitterNote[]): Promise<void> => {
  const storage = new Storage({ area: 'local' });
  await storage.set(DataService.TWITTER_NOTES_KEY, updatedNotes);
};

/**
 * 检查并同步备注数据
 */
export const checkAndSyncNotes = async (): Promise<TwitterNote[]> => {
  try {
    // 直接从本地存储获取用户状态（后台脚本每15秒自动更新）
    const userStatus = await TokenManager.getUserInfo();
    const localNotes = await DataService.getLocalTwitterNotes();
    
    // 检查用户状态中的推特备注数量与本地缓存数量是否一致
    if (!userStatus || !localNotes.length || userStatus.twitter_notes_count !== localNotes.length) {
      // 数据不一致或无用户状态时重新拉取
      return await fetchAllNotes();
    } else {
      // 数据一致时直接使用本地缓存
      return localNotes;
    }
  } catch {
    // 发生错误时使用本地缓存
    return await DataService.getLocalTwitterNotes();
  }
};

/**
 * 拉取所有备注数据
 */
export const fetchAllNotes = async (t?: (key: string) => string): Promise<TwitterNote[]> => {
  let allNotes: TwitterNote[] = [];
  let offset = 0;
  const limit = API_LIMITS.PAGE_LIMIT;
  let code429 = false;

  try {
    const token = await TokenManager.getToken();
    
    for (let i = 0; i < API_LIMITS.MAX_PAGES; i++) {
      const res = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_NOTES_LIST}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        body: JSON.stringify({ limit, offset }),
      });

      if (res.status === 429) {
        code429 = true;
        break;
      }

      const data = await res.json();
      if (data.code === 200) {
        allNotes.push(...(data.data.data || []));
        if (!data.data.has_more) break;
        offset += limit;
      } else {
        throw new Error(data.msg || (t ? t('twitterNotes.errorLoad') : 'Failed to load'));
      }
    }

    if (code429) {
      // 429时只用本地缓存
      const cached = await DataService.getLocalTwitterNotes();
      throw new Error((t ? t('twitterNotes.errorLoad') : 'Failed to load') + ' (429)');
    } else {
      // 使用DataService统一存储
      await DataService.clearLocalCache('twitter');
      await updateLocalCache(allNotes);
      return allNotes;
    }
  } catch (error) {
    // 发生错误时使用本地缓存
    const fallbackNotes = await DataService.getLocalTwitterNotes();
    throw error;
  }
};

/**
 * 更新备注
 */
export const updateNote = async (
  note: TwitterNote, 
  form: EditForm, 
  t: (key: string) => string
): Promise<TwitterNote> => {
  const token = await TokenManager.getToken();
  const res = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_NOTES_UPDATE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Tw3Track-Extension/1.0'
    },
    body: JSON.stringify({
      twitter_rest_id: note.twitter_rest_id,
      note: form.note,
      tags: form.tags,
    }),
  });

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.msg || t('twitterNotes.errorUpdate'));
  }

  return {
    ...note,
    note: form.note,
    tags: form.tags,
  };
};

/**
 * 删除备注
 */
export const deleteNote = async (
  note: TwitterNote, 
  t: (key: string) => string
): Promise<void> => {
  const token = await TokenManager.getToken();
  const res = await fetch(`${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_NOTES_DELETE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Tw3Track-Extension/1.0'
    },
    body: JSON.stringify({
      twitter_rest_id: note.twitter_rest_id,
    }),
  });

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.msg || t('twitterNotes.errorDelete'));
  }
};
