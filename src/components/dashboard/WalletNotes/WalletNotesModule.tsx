import React, { useEffect, useState } from "react"
import { toast } from "sonner"

import { Storage } from "@plasmohq/storage"

import { API_CONFIG } from "~src/config/config"
import { useSettings } from "~src/contexts/SettingsContext"
import { DataService } from "~src/services/notes.service"
import { TokenManager } from "~src/services/token.service"
// 导入类型
import type {
  PaginationInfo,
  SearchFilters,
  WalletNote,
  WalletNoteForm
} from "~src/types/wallet-notes.types"

import { DEFAULT_PAGE_SIZE, MAX_NOTES_LIMIT, MAX_PAGES } from "./constants"
// 导入工具函数和常量
import {
  createNewNote,
  deleteNote,
  filterNotes,
  paginateNotes,
  updateNote,
  validateForm
} from "./utils"
import { WalletNotesAddDialog } from "./WalletNotesAddDialog"
import { WalletNotesDeleteDialog } from "./WalletNotesDeleteDialog"
import { WalletNotesEditDialog } from "./WalletNotesEditDialog"
// 导入子组件
import { WalletNotesHeader } from "./WalletNotesHeader"
import { WalletNotesList } from "./WalletNotesList"
import { WalletNotesPagination } from "./WalletNotesPagination"
import { WalletNotesStats } from "./WalletNotesStats"

/**
 * 钱包笔记模块主组件
 * 负责状态管理、数据获取和业务逻辑
 */
export function WalletNotesModule() {
  const { t } = useSettings()

  // 数据状态
  const [notes, setNotes] = useState<WalletNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 搜索和分页状态
  const [search, setSearch] = useState<SearchFilters>({
    address: "",
    network: "",
    note: "",
    source: ""
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    hasMore: false
  })

  // 对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<WalletNote | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 表单状态
  const [form, setForm] = useState<WalletNoteForm>({
    wallet_address: "",
    network: "",
    note: "",
    source: ""
  })

  /**
   * 全量拉取所有钱包笔记，自动分页，最多5000条，缓存到本地
   */
  const fetchAllWalletNotes = async () => {
    setLoading(true)
    setError("")
    const allNotes: WalletNote[] = []
    let offset = 0
    const limit = MAX_NOTES_LIMIT
    let total = 0
    let hasMore = true
    let code429 = false

    try {
      const token = await TokenManager.getToken()
      for (let i = 0; i < MAX_PAGES && hasMore; i++) {
        const res = await fetch(
          API_CONFIG.BASE + API_CONFIG.ENDPOINTS.WALLET_NOTES_LIST,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "User-Agent": "Tw3Track-Extension/1.0"
            },
            body: JSON.stringify({ limit, offset })
          }
        )

        if (res.status === 429) {
          code429 = true
          break
        }

        const data = await res.json()
        if (data.code === 200) {
          allNotes.push(...(data.data.notes || []))
          total = data.data.total_count || allNotes.length
          hasMore = data.data.has_more
          offset += limit
        } else {
          setError(data.msg || t("walletNotes.errorLoad"))
          break
        }
      }

      if (code429) {
        // 429时只用本地缓存
        const cached = await DataService.getLocalWalletNotes()
        setNotes(cached)
        setPagination((prev) => ({
          ...prev,
          total: cached.length,
          hasMore: false
        }))
        setError(t("walletNotes.errorLoad") + " (429)")
      } else {
        // 使用DataService统一存储
        await DataService.clearLocalCache("wallet")
        const storage = new Storage({ area: "local" })
        await storage.set(DataService.WALLET_NOTES_KEY, allNotes)
        setNotes(allNotes)
        setPagination((prev) => ({ ...prev, total, hasMore: false }))
      }
    } catch (e) {
      setError(t("walletNotes.errorLoad"))
    } finally {
      setLoading(false)
    }
  }

  /**
   * 检查 user_status，数量不一致时同步后端数据
   */
  const checkAndSyncNotes = async () => {
    try {
      const userStatus = await TokenManager.getUserInfo()
      const localNotes = await DataService.getLocalWalletNotes()

      if (
        !userStatus ||
        !localNotes.length ||
        userStatus.wallet_notes_count !== localNotes.length
      ) {
        await fetchAllWalletNotes()
      } else {
        setNotes(localNotes)
        setPagination((prev) => ({
          ...prev,
          total: localNotes.length,
          hasMore: false
        }))
      }
    } catch {
      const fallbackNotes = await DataService.getLocalWalletNotes()
      setNotes(fallbackNotes)
    }
  }

  // 初始化数据
  useEffect(() => {
    checkAndSyncNotes()
    // eslint-disable-next-line
  }, [])

  /**
   * 更新本地缓存数据
   */
  const updateLocalCache = async (updatedNotes: WalletNote[]) => {
    const storage = new Storage({ area: "local" })
    await storage.set(DataService.WALLET_NOTES_KEY, updatedNotes)
    setNotes(updatedNotes)
    setPagination((prev) => ({ ...prev, total: updatedNotes.length }))
  }

  // 数据筛选和分页
  const filtered = filterNotes(notes, search)
  const paged = paginateNotes(filtered, pagination.page, pagination.pageSize)

  // 重置表单
  const resetForm = () => {
    setForm({ wallet_address: "", network: "", note: "", source: "" })
    setError("")
  }

  // 处理添加钱包
  const handleAdd = async () => {
    const err = validateForm(form, t)
    if (err) return setError(err)

    setLoading(true)
    try {
      const token = await TokenManager.getToken()
      const res = await fetch(
        API_CONFIG.BASE + API_CONFIG.ENDPOINTS.WALLET_NOTES_ADD,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...form })
        }
      )

      const data = await res.json()
      if (data.code === 200) {
        const newNote = createNewNote(form)
        const updatedNotes = [...notes, newNote]
        await updateLocalCache(updatedNotes)

        setIsAddDialogOpen(false)
        resetForm()

        toast.success(t("walletNotes.addSuccessTitle") || "Add Success", {
          description:
            t("walletNotes.addSuccessDesc") || "Wallet note added successfully."
        })
      } else {
        setError(data.msg || t("walletNotes.errorAdd"))
      }
    } catch (e) {
      setError(t("walletNotes.errorAdd"))
    } finally {
      setLoading(false)
    }
  }

  // 处理编辑
  const handleEdit = (note: WalletNote) => {
    setEditTarget(note)
    setForm({
      wallet_address: note.wallet_address,
      network: note.network,
      note: note.note,
      source: note.source
    })
  }

  const handleEditSave = async () => {
    if (!editTarget) return

    const err = validateForm(form, t)
    if (err) return setError(err)

    setLoading(true)
    try {
      const token = await TokenManager.getToken()
      const res = await fetch(
        API_CONFIG.BASE + API_CONFIG.ENDPOINTS.WALLET_NOTES_UPDATE,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "Tw3Track-Extension/1.0"
          },
          body: JSON.stringify({
            wallet_address: editTarget.wallet_address,
            network: editTarget.network,
            note: form.note,
            source: form.source
          })
        }
      )

      const data = await res.json()
      if (data.code === 200) {
        const updatedNotes = updateNote(notes, editTarget, {
          note: form.note,
          source: form.source
        })
        await updateLocalCache(updatedNotes)

        setEditTarget(null)
        resetForm()

        toast.success(t("walletNotes.editSuccessTitle") || "Edit Success", {
          description:
            t("walletNotes.editSuccessDesc") ||
            "Wallet note updated successfully."
        })
      } else {
        setError(data.msg || t("walletNotes.errorEdit"))
      }
    } catch (e) {
      setError(t("walletNotes.errorEdit"))
    } finally {
      setLoading(false)
    }
  }

  // 处理删除
  const handleDelete = (address: string) => {
    setDeleteTarget(address)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const token = await TokenManager.getToken()
      const res = await fetch(
        API_CONFIG.BASE + API_CONFIG.ENDPOINTS.WALLET_NOTES_DELETE,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            'User-Agent': 'Tw3Track-Extension/1.0'
          },
          body: JSON.stringify({ wallet_address: deleteTarget })
        }
      )

      const data = await res.json()
      if (data.code === 200) {
        const updatedNotes = deleteNote(notes, deleteTarget)
        await updateLocalCache(updatedNotes)

        setDeleteTarget(null)
        setDeleteDialogOpen(false)
        resetForm()

        toast.success(t("walletNotes.deleteSuccessTitle") || "Delete Success", {
          description:
            t("walletNotes.deleteSuccessDesc") ||
            "Wallet note deleted successfully."
        })
      } else {
        setError(data.msg || t("walletNotes.errorDelete"))
      }
    } catch (e) {
      setError(t("walletNotes.errorDelete"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <WalletNotesHeader onAddClick={() => setIsAddDialogOpen(true)} />

      {/* 顶部统计、搜索按钮紧凑布局 */}
      <WalletNotesStats
        notes={notes}
        search={search}
        onSearchChange={setSearch}
      />

      {/* 钱包列表 */}
      <WalletNotesList
        notes={notes}
        loading={loading}
        filtered={filtered}
        paged={paged}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 分页UI */}
      <WalletNotesPagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      />

      {/* 添加对话框 */}
      <WalletNotesAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        form={form}
        onFormChange={setForm}
        error={error}
        loading={loading}
        onAdd={handleAdd}
      />

      {/* 编辑对话框 */}
      <WalletNotesEditDialog
        editTarget={editTarget}
        onEditTargetChange={setEditTarget}
        form={form}
        onFormChange={setForm}
        error={error}
        loading={loading}
        onSave={handleEditSave}
      />

      {/* 删除确认对话框 */}
      <WalletNotesDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteTarget={deleteTarget}
        error={error}
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
