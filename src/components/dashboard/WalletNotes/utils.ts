import { WALLET_NETWORKS, NOTE_SOURCE_REGEX } from './constants';
import type { WalletNoteForm, WalletNote } from '~src/types/wallet-notes.types';

/**
 * 获取钱包地址对应的正则表达式
 */
export function getWalletRegex(network: string): RegExp | null {
  const net = WALLET_NETWORKS.find(n => n.key === network);
  return net ? net.regex : null;
}

/**
 * 自动识别钱包地址的网络类型
 */
export function detectNetwork(address: string): string {
  for (const net of WALLET_NETWORKS) {
    if (net.regex.test(address)) return net.key;
  }
  return '';
}

/**
 * 验证表单数据
 */
export function validateForm(form: WalletNoteForm, t: (key: string) => string): string {
  if (!form.wallet_address || !form.network) {
    return t('walletNotes.errorRequired');
  }
  
  if (form.note.length > 100 || form.source.length > 100) {
    return t('walletNotes.errorLength');
  }
  
  if (!NOTE_SOURCE_REGEX.test(form.note) || !NOTE_SOURCE_REGEX.test(form.source)) {
    return t('walletNotes.errorChar');
  }
  
  const regex = getWalletRegex(form.network);
  if (!regex || !regex.test(form.wallet_address)) {
    return t('walletNotes.errorAddress');
  }
  
  return '';
}

/**
 * 筛选钱包笔记
 */
export function filterNotes(
  notes: WalletNote[],
  search: { address: string; network: string; note: string; source: string }
): WalletNote[] {
  return notes.filter(n =>
    (!search.address || n.wallet_address.includes(search.address)) &&
    (!search.network || n.network === search.network) &&
    (!search.note || n.note.includes(search.note)) &&
    (!search.source || n.source.includes(search.source))
  );
}

/**
 * 分页处理
 */
export function paginateNotes(
  notes: WalletNote[],
  page: number,
  pageSize: number
): WalletNote[] {
  return notes.slice((page - 1) * pageSize, page * pageSize);
}

/**
 * 创建新的钱包笔记对象
 */
export function createNewNote(form: WalletNoteForm): WalletNote {
  const now = new Date().toISOString();
  return {
    wallet_address: form.wallet_address,
    network: form.network,
    note: form.note,
    source: form.source,
    created_at: now,
    updated_at: now
  };
}

/**
 * 更新钱包笔记
 */
export function updateNote(
  notes: WalletNote[],
  editTarget: WalletNote,
  updatedData: { note: string; source: string }
): WalletNote[] {
  return notes.map(note => 
    note.wallet_address === editTarget.wallet_address && note.network === editTarget.network
      ? { 
          ...note, 
          note: updatedData.note, 
          source: updatedData.source, 
          updated_at: new Date().toISOString() 
        }
      : note
  );
}

/**
 * 删除钱包笔记
 */
export function deleteNote(notes: WalletNote[], walletAddress: string): WalletNote[] {
  return notes.filter(note => note.wallet_address !== walletAddress);
}
