<script setup lang="ts">
import type { ThemePreset } from '../types'

defineProps<{
  theme: ThemePreset
}>()

defineEmits<{
  add: []
}>()
</script>

<template>
  <div class="input-area">
    <button class="add-btn" :style="{ color: theme.text }" @click="$emit('add')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      新增备忘录
    </button>
  </div>
</template>

<style scoped>
.input-area {
  padding: 12px 14px 4px;
}

.add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(137, 180, 250, 0.15);
  border: 1px dashed rgba(137, 180, 250, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  color: inherit;
}

.add-btn:hover {
  background: rgba(137, 180, 250, 0.25);
}
</style>
