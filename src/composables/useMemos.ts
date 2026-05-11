import { ref, toRaw } from 'vue'
import type { Memo } from '../types'
import { useLogger } from './useLogger'

const COLORS = [
  '#f38ba8', '#fab387', '#f9e2af', '#a6e3a1',
  '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7',
]

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

const LEGACY_KEY = 'memo-notes'

export function useMemos() {
  const log = useLogger('useMemos')
  const memos = ref<Memo[]>([])

  async function load() {
    const data = await window.electronAPI?.fileRead('memos')
    if (data) {
      memos.value = data
    } else {
      // 迁移旧 localStorage 数据
      const saved = localStorage.getItem(LEGACY_KEY)
      if (saved) {
        try { memos.value = JSON.parse(saved) } catch { memos.value = [] }
        if (memos.value.length) await save()
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    log.info(`Loaded ${memos.value.length} memos`)
  }

  async function save() {
    await window.electronAPI?.fileWrite('memos', toRaw(memos.value))
  }

  async function addMemo(text: string, reminderTime?: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const memo: Memo = { id: Date.now(), text: trimmed, color: randomColor(), createdAt: new Date().toISOString() }
    if (reminderTime) memo.reminderTime = reminderTime
    memos.value.unshift(memo)
    await save()
    log.info(`Added memo: ${trimmed}`)
  }

  async function removeMemo(id: number) {
    memos.value = memos.value.filter((m) => m.id !== id)
    await save()
    log.info(`Removed memo ${id}`)
  }

  async function updateMemoColor(memo: Memo, color: string) {
    memo.color = color
    await save()
    log.debug(`Updated memo ${memo.id} color: ${color}`)
  }

  async function updateMemoText(memo: Memo, text: string, reminderTime?: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    memo.text = trimmed
    if (reminderTime !== undefined) {
      memo.reminderTime = reminderTime || undefined
    }
    await save()
    log.info(`Updated memo ${memo.id} text`)
  }

  async function clearReminderTime(memoId: number) {
    const memo = memos.value.find(m => m.id === memoId)
    if (memo) {
      memo.reminderTime = undefined
      await save()
      log.info(`Cleared reminder for memo ${memoId}`)
    }
  }

  return { memos, load, addMemo, removeMemo, updateMemoColor, updateMemoText, clearReminderTime }
}
