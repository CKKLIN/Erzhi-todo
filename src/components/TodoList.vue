<script setup lang="ts">
import { onMounted } from 'vue'
import type { Todo, ThemePreset } from '../types'
import { hexToRgba } from '../constants'

defineProps<{
  todos: Todo[]
  theme: ThemePreset
}>()

const emit = defineEmits<{
  toggle: [todo: Todo]
  remove: [id: number]
  updateColor: [todo: Todo, color: string]
  edit: [todo: Todo]
}>()

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

let pendingTodo: Todo | null = null

function onContextMenu(e: MouseEvent, todo: Todo) {
  e.preventDefault()
  pendingTodo = todo
  window.electronAPI?.showContextMenu(e.screenX, e.screenY, {
    time: formatTime(todo.createdAt),
    currentColor: todo.color,
  })
}

function onColorPicked(color: string) {
  if (pendingTodo) {
    emit('updateColor', pendingTodo, color)
    pendingTodo = null
  }
}

function startEdit(todo: Todo) {
  emit('edit', todo)
}

onMounted(() => {
  window.electronAPI?.onColorPicked(onColorPicked)
})
</script>

<template>
  <div class="todo-list" @contextmenu.prevent>
    <div
      v-for="todo in todos"
      :key="todo.id"
      class="todo-item"
      :class="{ done: todo.done }"
      :style="{ background: hexToRgba(todo.color, 0.1) }"
      @contextmenu="onContextMenu($event, todo)"
    >
      <span class="color-dot" :style="{ background: todo.color }"></span>
      <button class="check-btn" :style="{ borderColor: todo.color }" @click="$emit('toggle', todo)">
        <span v-if="todo.done" class="check-mark" :style="{ color: todo.color }">&#10003;</span>
      </button>
      <span
        class="todo-text"
        :style="{ color: theme.text }"
        @click="$emit('toggle', todo)"
        @dblclick="startEdit(todo)"
        v-html="todo.text"
      ></span>
      <button class="edit-btn" @click="startEdit(todo)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="delete-btn" @click="$emit('remove', todo.id)">&times;</button>
    </div>
    <div v-if="todos.length === 0" class="empty" :style="{ color: theme.muted }">
      暂无待办事项
    </div>
  </div>
</template>

<style scoped>
.todo-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 14px;
}

.todo-list::-webkit-scrollbar {
  width: 4px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  transition: background 0.15s;
  margin-bottom: 4px;
}

.check-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #585b70;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.check-mark {
  font-size: 12px;
  font-weight: bold;
}

.todo-item.done .check-btn {
  background: currentColor;
  opacity: 0.2;
}

.color-dot {
  flex-shrink: 0;
  width: 4px;
  height: 20px;
  border-radius: 2px;
}

.todo-text {
  flex: 1;
  font-size: 13px;
  cursor: pointer;
  line-height: 1.4;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.todo-text :deep(strong) { font-weight: 600; }
.todo-text :deep(em) { font-style: italic; }
.todo-text :deep(u) { text-decoration: underline; }
.todo-text :deep(s) { text-decoration: line-through; }
.todo-text :deep(h1),
.todo-text :deep(h2),
.todo-text :deep(h3) { font-weight: 600; margin: 0; font-size: inherit; }
.todo-text :deep(ul),
.todo-text :deep(ol) { padding-left: 1.2em; margin: 0; }
.todo-text :deep(img) { max-height: 40px; vertical-align: middle; border-radius: 3px; }

.todo-item.done .todo-text {
  opacity: 0.4;
  text-decoration: line-through;
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

.todo-item:hover .edit-btn {
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

.todo-item:hover .delete-btn {
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
