<script setup lang="ts">
import { ref } from 'vue'
import type { ThemePreset } from '../types'

defineProps<{
  theme: ThemePreset
}>()

const emit = defineEmits<{
  add: [text: string]
}>()

const text = ref('')

function submit() {
  if (!text.value.trim()) return
  emit('add', text.value)
  text.value = ''
}
</script>

<template>
  <div class="input-area">
    <input
      v-model="text"
      class="todo-input"
      :style="{ background: theme.inputBg, color: theme.text, borderColor: theme.border }"
      placeholder="输入待办事项..."
      @keyup.enter="submit"
    />
    <button class="add-btn" :style="{ color: theme.text }" @click="submit">添加</button>
  </div>
</template>

<style scoped>
.input-area {
  display: flex;
  padding: 12px 14px;
  gap: 8px;
}

.todo-input {
  flex: 1;
  border: 1px solid;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
}

.todo-input::placeholder {
  color: #585b70;
}

.add-btn {
  background: rgba(137, 180, 250, 0.15);
  border: 1px solid rgba(137, 180, 250, 0.3);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.add-btn:hover {
  background: rgba(137, 180, 250, 0.25);
}
</style>
