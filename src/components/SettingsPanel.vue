<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ThemePreset } from '../types'
import { THEME_PRESETS, hexToRgba } from '../constants'

const props = defineProps<{
  theme: ThemePreset
  minW: number
  minH: number
}>()

const emit = defineEmits<{
  'update:theme': [value: ThemePreset]
  'update:minW': [value: number]
  'update:minH': [value: number]
  save: []
}>()

const pendingColor = ref<string | null>(null)
const opacity = ref(88)

function parseBg(bg: string) {
  const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('')
    const am = bg.match(/[\d.]+(?=\))/)
    const a = am ? Math.round(parseFloat(am[0]) * 100) : 100
    return { hex, alpha: a }
  }
  return { hex: '#1e1e2e', alpha: 88 }
}

function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function buildTheme(hex: string, alpha: number): ThemePreset {
  const light = isLightColor(hex)
  return {
    name: '自定义',
    bg: hexToRgba(hex, alpha / 100),
    text: light ? '#1e1e2e' : '#e2e8f0',
    muted: light ? '#9ca3af' : '#64748b',
    border: light ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)',
    inputBg: light ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
    hover: light ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
  }
}

watch(() => props.theme, (t) => {
  const p = parseBg(t.bg)
  opacity.value = p.alpha
}, { immediate: true })

function onPickColor() {
  pendingColor.value = null
}

function onColorChange(e: Event) {
  pendingColor.value = (e.target as HTMLInputElement).value
}

function onColorConfirm() {
  if (!pendingColor.value) return
  emit('update:theme', buildTheme(pendingColor.value, opacity.value))
  pendingColor.value = null
}

function onCancelColor() {
  pendingColor.value = null
}

function onOpacityChange(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  opacity.value = v
  const p = parseBg(props.theme.bg)
  emit('update:theme', buildTheme(p.hex, v))
}

function openMoreSettings() {
  window.electronAPI?.openSettings()
}
</script>

<template>
  <div class="settings-panel">
    <div class="settings-row">
      <span class="settings-label">主题</span>
      <div class="theme-options">
        <button
          v-for="t in THEME_PRESETS"
          :key="t.name"
          class="theme-chip"
          :class="{ active: theme.name === t.name }"
          :style="{ background: t.bg, color: t.text, borderColor: theme.name === t.name ? t.text : t.border }"
          @click="$emit('update:theme', t)"
        >{{ t.name }}</button>
        <span class="picker-group">
          <label class="picker-btn" :class="{ preview: pendingColor }" :style="pendingColor ? { background: pendingColor } : {}">
            <template v-if="!pendingColor">+</template>
            <input type="color" @click="onPickColor" @input="onColorChange" />
          </label>
          <button v-if="pendingColor" class="confirm-btn" @click="onColorConfirm">✓</button>
          <button v-if="pendingColor" class="cancel-btn" @click="onCancelColor">✕</button>
        </span>
      </div>
    </div>
    <div class="settings-row">
      <span class="settings-label">透明度</span>
      <div class="opacity-slider">
        <input type="range" min="0" max="100" :value="opacity" @input="onOpacityChange" />
        <span class="opacity-value">{{ opacity }}%</span>
      </div>
    </div>
    <div class="more-settings-row">
      <button class="more-settings-btn" @click="openMoreSettings">
        更多设置
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-label {
  font-size: 13px;
  white-space: nowrap;
  color: #cdd6f4;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.settings-row:last-of-type {
  margin-bottom: 14px;
}

.theme-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.theme-chip {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s;
  white-space: nowrap;
}

.theme-chip.active {
  font-weight: 600;
}

.settings-input {
  width: 70px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 13px;
  outline: none;
  text-align: center;
}

.save-btn {
  width: 100%;
  padding: 7px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.save-btn:hover {
  opacity: 0.85;
}

.picker-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.picker-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px dashed rgba(128, 128, 128, 0.4);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(128, 128, 128, 0.6);
  font-size: 14px;
  transition: all 0.15s;
  position: relative;
}

.picker-btn:hover {
  border-color: rgba(128, 128, 128, 0.7);
  color: rgba(128, 128, 128, 0.9);
}

.picker-btn.preview {
  border-style: solid;
  border-color: transparent;
}

.picker-btn input[type="color"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
}

.confirm-btn,
.cancel-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: all 0.15s;
}

.confirm-btn {
  background: rgba(166, 227, 161, 0.2);
  color: #a6e3a1;
}

.confirm-btn:hover {
  background: rgba(166, 227, 161, 0.4);
}

.cancel-btn {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}

.cancel-btn:hover {
  background: rgba(243, 139, 168, 0.3);
}

.opacity-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opacity-slider input[type="range"] {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
}

.opacity-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #cdd6f4;
  cursor: pointer;
  border: none;
}

.opacity-value {
  font-size: 12px;
  color: #a6adc8;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.more-settings-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.more-settings-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #6c7086;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.more-settings-btn:hover {
  color: #cdd6f4;
  background: rgba(255, 255, 255, 0.04);
}
</style>
