import React, { useState, useEffect } from 'react';
import { useSettings } from '~src/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { FileText } from 'lucide-react';
import { toast } from "sonner";

// 导入子组件
import { TwitterNotesHeader } from './TwitterNotesHeader';
import { TwitterNotesStats } from './TwitterNotesStats';
import { TwitterNotesList } from './TwitterNotesList';
import { TwitterNotesEditDialog } from './TwitterNotesEditDialog';
import { TwitterNotesDeleteDialog } from './TwitterNotesDeleteDialog';
import { TwitterNotesPagination } from './TwitterNotesPagination';

// 导入工具函数和常量
import {
  validateForm,
  filterNotes,
  paginateNotes,
  updateLocalCache,
  checkAndSyncNotes,
  fetchAllNotes,
  updateNote,
  deleteNote
} from './utils';
import { PAGE_SIZE } from './constants';

// 导入类型
import type {
  TwitterNote,
  SearchFilters,
  EditForm
} from '~src/types/twitter-notes.types';

export function TwitterNotesModule() {
  const { t } = useSettings();
  
  // 状态管理
  const [notes, setNotes] = useState<TwitterNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 搜索和筛选状态
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  
  // 编辑状态
  const [editTarget, setEditTarget] = useState<TwitterNote | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ note: '', tags: [] });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // 删除状态
  const [deleteTarget, setDeleteTarget] = useState<TwitterNote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 分页状态
  const [page, setPage] = useState(1);

  // 初始化数据加载
  useEffect(() => {
    handleCheckAndSync();
    // eslint-disable-next-line
  }, []);

  // 检查并同步数据
  const handleCheckAndSync = async () => {
    setLoading(true);
    setError('');
    try {
      const syncedNotes = await checkAndSyncNotes();
      setNotes(syncedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('twitterNotes.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const freshNotes = await fetchAllNotes(t);
      setNotes(freshNotes);
      toast.success(t('twitterNotes.refreshSuccess'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('twitterNotes.errorLoad');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 过滤和分页处理
  const filters: SearchFilters = { search, tagFilter };
  const filteredNotes = filterNotes(notes, filters);
  const paginatedNotes = paginateNotes(filteredNotes, page, PAGE_SIZE);

  // 编辑相关处理
  const handleEdit = (note: TwitterNote) => {
    setEditTarget(note);
    setEditForm({ note: note.note, tags: note.tags });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    
    const validationError = validateForm(editForm, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updatedNote = await updateNote(editTarget, editForm, t);
      
      // 更新本地状态
      const updatedNotes = notes.map(note => 
        note.twitter_rest_id === editTarget.twitter_rest_id ? updatedNote : note
      );
      setNotes(updatedNotes);
      await updateLocalCache(updatedNotes);
      
      setEditDialogOpen(false);
      setEditTarget(null);
      toast.success(t('twitterNotes.updateSuccess'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('twitterNotes.errorUpdate');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 删除相关处理
  const handleDelete = (note: TwitterNote) => {
    setDeleteTarget(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    setError('');
    try {
      await deleteNote(deleteTarget, t);
      
      // 更新本地状态
      const updatedNotes = notes.filter(note => 
        note.twitter_rest_id !== deleteTarget.twitter_rest_id
      );
      setNotes(updatedNotes);
      await updateLocalCache(updatedNotes);
      
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      toast.success(t('twitterNotes.deleteSuccess'));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('twitterNotes.errorDelete');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('twitterNotes.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* 头部搜索和筛选 */}
        <TwitterNotesHeader
          search={search}
          onSearchChange={setSearch}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* 统计信息 */}
        <TwitterNotesStats
          total={notes.length}
          filtered={filteredNotes.length}
          loading={loading}
        />

        {/* 备注列表 */}
        <TwitterNotesList
          notes={paginatedNotes}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* 分页 */}
        <TwitterNotesPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredNotes.length}
          onPageChange={setPage}
        />
      </CardContent>

      {/* 编辑对话框 */}
      <TwitterNotesEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editTarget={editTarget}
        editForm={editForm}
        onFormChange={setEditForm}
        onSave={handleEditSave}
        loading={loading}
      />

      {/* 删除对话框 */}
      <TwitterNotesDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteTarget={deleteTarget}
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />
    </Card>
  );
}


