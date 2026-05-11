<script setup lang="ts">
import type { ThemePreset } from '../types'

defineProps<{
  theme: ThemePreset
  activeTab: 'todo' | 'memo'
}>()

defineEmits<{
  switchTab: [tab: 'todo' | 'memo']
  toggleSettings: []
  minimize: []
  close: []
}>()
</script>

<template>
  <div class="titlebar">
    <div class="tabs" :style="{ background: theme.inputBg }">
      <button
        class="tab"
        :class="{ active: activeTab === 'todo' }"
        :style="activeTab === 'todo' ? { background: theme.bg, color: theme.text } : { color: theme.muted }"
        @click="$emit('switchTab', 'todo')"
      >待办</button>
      <button
        class="tab"
        :class="{ active: activeTab === 'memo' }"
        :style="activeTab === 'memo' ? { background: theme.bg, color: theme.text } : { color: theme.muted }"
        @click="$emit('switchTab', 'memo')"
      >备忘录</button>
    </div>
    <div class="titlebar-actions">
      <button class="title-btn" :style="{ color: theme.muted }" @click="$emit('toggleSettings')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <button class="title-btn" :style="{ color: theme.muted }" @click="$emit('minimize')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button class="close-btn" :style="{ color: theme.muted }" @click="$emit('close')">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  -webkit-app-region: drag;
}

.tabs {
  display: flex;
  border-radius: 8px;
  padding: 2px;
  -webkit-app-region: no-drag;
}

.tab {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
  z-index: 0;
}

.tab.active {
  z-index: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.titlebar-actions {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.title-btn,
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;
  font-size: 18px;
}

.title-btn:hover {
  opacity: 0.7;
}
</style>
