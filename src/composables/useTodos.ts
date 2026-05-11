import { ref, computed, toRaw } from 'vue'
import type { Todo } from '../types'
import { useLogger } from './useLogger'

const COLORS = [
  '#f38ba8', '#fab387', '#f9e2af', '#a6e3a1',
  '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7',
]

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

const LEGACY_KEY = 'memo-todos'

export function useTodos() {
  const log = useLogger('useTodos')
  const todos = ref<Todo[]>([])

  const sortedTodos = computed(() => {
    const undone = todos.value.filter((t) => !t.done)
    const done = todos.value.filter((t) => t.done)
    return [...undone, ...done]
  })

  async function load() {
    const data = await window.electronAPI?.fileRead('todos')
    if (data) {
      todos.value = data
    } else {
      // 迁移旧 localStorage 数据
      const saved = localStorage.getItem(LEGACY_KEY)
      if (saved) {
        try { todos.value = JSON.parse(saved) } catch { todos.value = [] }
        if (todos.value.length) await save()
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    log.info(`Loaded ${todos.value.length} todos`)
  }

  async function save() {
    await window.electronAPI?.fileWrite('todos', toRaw(todos.value))
  }

  async function addTodo(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    todos.value.unshift({ id: Date.now(), text: trimmed, done: false, color: randomColor(), createdAt: new Date().toISOString() })
    await save()
    log.info(`Added todo: ${trimmed}`)
  }

  async function toggleTodo(todo: Todo) {
    todo.done = !todo.done
    await save()
    log.debug(`Toggled todo ${todo.id}: ${todo.done ? 'done' : 'undone'}`)
  }

  async function removeTodo(id: number) {
    todos.value = todos.value.filter((t) => t.id !== id)
    await save()
    log.info(`Removed todo ${id}`)
  }

  async function updateTodoColor(todo: Todo, color: string) {
    todo.color = color
    await save()
    log.debug(`Updated todo ${todo.id} color: ${color}`)
  }

  async function updateTodoText(todo: Todo, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    todo.text = trimmed
    await save()
    log.info(`Updated todo ${todo.id} text`)
  }

  return { todos, sortedTodos, load, addTodo, toggleTodo, removeTodo, updateTodoColor, updateTodoText }
}
