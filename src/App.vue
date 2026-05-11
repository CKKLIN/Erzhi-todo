<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Memo, Todo } from './types'
import { useTodos } from './composables/useTodos'
import { useMemos } from './composables/useMemos'
import { useSettings } from './composables/useSettings'
import { useLogger } from './composables/useLogger'
import Titlebar from './components/Titlebar.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import TodoInput from './components/TodoInput.vue'
import TodoList from './components/TodoList.vue'
import MemoInput from './components/MemoInput.vue'
import MemoList from './components/MemoList.vue'

const { sortedTodos, load: loadTodos, addTodo, toggleTodo, removeTodo, updateTodoColor, updateTodoText } = useTodos()
const { memos, load: loadMemos, addMemo, removeMemo, updateMemoColor, updateMemoText, clearReminderTime } = useMemos()
const { theme, minW, minH, load: loadSettings, save: saveSettings } = useSettings()

const log = useLogger('App')
const activeTab = ref<'todo' | 'memo'>('todo')
const showSettings = ref(false)

let broadcastTimer: ReturnType<typeof setTimeout> | null = null
watch(theme, (newTheme) => {
  if (broadcastTimer) clearTimeout(broadcastTimer)
  broadcastTimer = setTimeout(() => {
    window.electronAPI?.broadcastTheme(JSON.stringify(newTheme))
    saveSettings()
  }, 150)
})

function addNewMemo() {
  editingMemoId = null
  window.electronAPI?.openEditor('')
  log.info('Opening new memo editor')
}

let editingMemoId: number | null = null
let editingTodoId: number | null = null

function onEditorSaved(text: string, editorMode: string, reminderTime?: string) {
  if (!text.trim()) return
  if (editorMode === 'todo') {
    if (editingTodoId !== null) {
      const todo = sortedTodos.value.find(t => t.id === editingTodoId)
      if (todo) updateTodoText(todo, text.trim())
      editingTodoId = null
    }
  } else {
    if (editingMemoId !== null) {
      const memo = memos.value.find(m => m.id === editingMemoId)
      if (memo) updateMemoText(memo, text.trim(), reminderTime)
      editingMemoId = null
    } else {
      addMemo(text.trim(), reminderTime)
    }
  }
  window.electronAPI?.syncReminders()
  log.info(`Editor saved (mode: ${editorMode})`)
}

function onEditMemo(memo: Memo) {
  editingMemoId = memo.id
  window.electronAPI?.openEditor(memo.text, 'memo', {
    memoId: memo.id,
    reminderTime: memo.reminderTime,
  })
  log.info(`Editing memo ${memo.id}`)
}

function handleRemoveMemo(id: number) {
  removeMemo(id)
  window.electronAPI?.syncReminders()
}

function onEditTodo(todo: Todo) {
  editingTodoId = todo.id
  window.electronAPI?.openEditor(todo.text, 'todo')
  log.info(`Editing todo ${todo.id}`)
}

function minimizeWindow() {
  window.electronAPI.minimizeWindow()
}

function closeWindow() {
  window.close()
}

onMounted(async () => {
  await loadTodos()
  await loadMemos()
  loadSettings()
  document.addEventListener('click', onDocClick)
  window.electronAPI?.onEditorSaved(onEditorSaved)
  window.electronAPI?.onReminderFired((memoId: number) => {
    clearReminderTime(memoId)
  })
  await window.electronAPI?.syncReminders()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

function onDocClick(e: MouseEvent) {
  if (!showSettings.value) return
  const panel = document.querySelector('.settings-panel')
  if (panel && !panel.contains(e.target as Node) && !(e.target as Element).closest('.title-btn')) {
    showSettings.value = false
  }
}

function closeEditor() {
  window.electronAPI?.openEditor('__close__')
}

function onSwitchTab(tab: 'todo' | 'memo') {
  activeTab.value = tab
  editingMemoId = null
  editingTodoId = null
  closeEditor()
}

function onToggleSettings() {
  showSettings.value = !showSettings.value
}

function onSaveSettings() {
  saveSettings()
  showSettings.value = false
  log.info('Settings saved and panel closed')
}
</script>

<template>
  <div class="app" :style="{ background: theme.bg, borderColor: theme.border }">
    <Titlebar
      :theme="theme"
      :active-tab="activeTab"
      @switch-tab="onSwitchTab($event)"
      @toggle-settings="onToggleSettings"
      @minimize="minimizeWindow()"
      @close="closeWindow()"
    />

    <SettingsPanel
      v-show="showSettings"
      :theme="theme"
      :min-w="minW"
      :min-h="minH"
      @update:theme="theme = $event"
      @update:min-w="minW = $event"
      @update:min-h="minH = $event"
      @save="onSaveSettings"
    />

    <template v-if="activeTab === 'todo'">
      <TodoInput :theme="theme" @add="addTodo" />
      <TodoList
        :todos="sortedTodos"
        :theme="theme"
        @toggle="toggleTodo"
        @remove="removeTodo"
        @update-color="updateTodoColor"
        @edit="onEditTodo"
      />
    </template>

    <template v-else>
      <MemoInput :theme="theme" @add="addNewMemo" />
      <MemoList
        :memos="memos"
        :theme="theme"
        @remove="handleRemoveMemo"
        @update-color="updateMemoColor"
        @edit="onEditMemo"
      />
    </template>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, 'Microsoft YaHei', sans-serif;
  background: transparent;
  overflow: hidden;
  user-select: none;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid;
  overflow: hidden;
}
</style>
