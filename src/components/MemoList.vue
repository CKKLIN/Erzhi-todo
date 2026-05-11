<script setup lang="ts">
import { onMounted } from 'vue'
import type { Memo, ThemePreset } from '../types'
import { hexToRgba } from '../constants'

defineProps<{
  memos: Memo[]
  theme: ThemePreset
}>()

const emit = defineEmits<{
  remove: [id: number]
  updateColor: [memo: Memo, color: string]
  edit: [memo: Memo]
}>()

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatReminder(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (d.toDateString() === now.toDateString()) return `今天 ${time}`
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return `明天 ${time}`
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`
}

let pendingMemo: Memo | null = null

function onContextMenu(e: MouseEvent, memo: Memo) {
  e.preventDefault()
  pendingMemo = memo
  window.electronAPI?.showContextMenu(e.screenX, e.screenY, {
    time: formatTime(memo.createdAt),
    currentColor: memo.color,
    reminderTime: memo.reminderTime && new Date(memo.reminderTime) > new Date() ? formatReminder(memo.reminderTime) : '',
  })
}

function onColorPicked(color: string) {
  if (pendingMemo) {
    emit('updateColor', pendingMemo, color)
    pendingMemo = null
  }
}

function startEdit(memo: Memo) {
  pendingMemo = memo
  emit('edit', memo)
}

onMounted(() => {
  window.electronAPI?.onColorPicked(onColorPicked)
})
</script>

<template>
  <div class="memo-list" @contextmenu.prevent>
    <div
      v-for="memo in memos"
      :key="memo.id"
      class="memo-item"
      :style="{ background: hexToRgba(memo.color, 0.1) }"
      @contextmenu="onContextMenu($event, memo)"
    >
      <span class="color-dot" :style="{ background: memo.color }"></span>
      <span
        class="memo-text"
        :style="{ color: theme.text }"
        @dblclick="startEdit(memo)"
        v-html="memo.text"
      ></span>
      <span
        v-if="memo.reminderTime && new Date(memo.reminderTime) > new Date()"
        class="reminder-badge"
        :title="formatReminder(memo.reminderTime)"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {{ formatReminder(memo.reminderTime) }}
      </span>
      <button class="edit-btn" @click="startEdit(memo)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="delete-btn" @click="$emit('remove', memo.id)">&times;</button>
    </div>
    <div v-if="memos.length === 0" class="empty" :style="{ color: theme.muted }">
      暂无备忘录
    </div>
  </div>
</template>

<style scoped>
.memo-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 14px;
}

.memo-list::-webkit-scrollbar {
  width: 4px;
}

.memo-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.memo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  transition: background 0.15s;
  margin-bottom: 4px;
}

.color-dot {
  flex-shrink: 0;
  width: 4px;
  height: 20px;
  border-radius: 2px;
}

.memo-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.memo-text :deep(strong) { font-weight: 600; }
.memo-text :deep(em) { font-style: italic; }
.memo-text :deep(u) { text-decoration: underline; }
.memo-text :deep(s) { text-decoration: line-through; }
.memo-text :deep(h1),
.memo-text :deep(h2),
.memo-text :deep(h3) { font-weight: 600; margin: 0; font-size: inherit; }
.memo-text :deep(ul),
.memo-text :deep(ol) { padding-left: 1.2em; margin: 0; }
.memo-text :deep(img) { max-height: 40px; vertical-align: middle; border-radius: 3px; }

.reminder-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #f9e2af;
  white-space: nowrap;
  flex-shrink: 0;
  opacity: 0.85;
}

.memo-item:hover .reminder-badge {
  color: transparent;
  pointer-events: none;
}

.edit-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  color: transparent;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s;
  font-size: 16px;
}

.memo-item:hover .edit-btn {
  color: #6c7086;
}

.edit-btn:hover {
  background: rgba(137, 180, 250, 0.15);
  color: #89b4fa !important;
}

.delete-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  color: transparent;
  font-size: 16px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s;
}

.memo-item:hover .delete-btn {
  color: #6c7086;
}

.delete-btn:hover {
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8 !important;
}

.empty {
  text-align: center;
  font-size: 13px;
  padding: 40px 0;
}
</style>
