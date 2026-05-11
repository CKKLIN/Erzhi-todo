<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { THEME_PRESETS } from '../constants'
import type { ThemePreset } from '../types'

const activeTab = ref<'general' | 'about'>('general')
const autoStart = ref(false)
const appInfo = ref({
  name: '',
  version: '',
  electron: '',
  chrome: '',
  node: '',
})

const theme = ref<ThemePreset>(THEME_PRESETS[0])

const isDark = computed(() => {
  return theme.value.name !== '纯白'
})

function loadTheme() {
  try {
    const saved = localStorage.getItem('memo-settings')
    if (saved) {
      const s = JSON.parse(saved)
      if (s.themeData && s.themeData.bg) {
        theme.value = s.themeData
      } else {
        const found = THEME_PRESETS.find((t) => t.name === s.themeName)
        if (found) theme.value = found
      }
    }
  } catch { /* ignore */ }
}

function closeWindow() {
  window.settingsAPI.close()
}

async function loadData() {
  autoStart.value = await window.settingsAPI.getAutoStart()
  appInfo.value = await window.settingsAPI.getAppInfo()
}

async function toggleAutoStart() {
  autoStart.value = !autoStart.value
  window.settingsAPI.setAutoStart(autoStart.value)
}

function checkUpdate() {
  window.settingsAPI.openExternal('https://gitee.com/ckklin/memo---to-do-tool/releases')
}

function onThemeChanged(themeJson: string) {
  try {
    const parsed = JSON.parse(themeJson) as ThemePreset
    if (parsed && parsed.bg) theme.value = parsed
  } catch { /* ignore */ }
}

onMounted(() => {
  loadTheme()
  loadData()
  window.settingsAPI.onThemeChanged(onThemeChanged)
})

onBeforeUnmount(() => {
  // cleanup if needed
})
</script>

<template>
  <div class="settings-window" :style="{ background: theme.bg, borderColor: theme.border }">
    <div class="titlebar">
      <span class="titlebar-label" :style="{ color: theme.text }">设置</span>
      <div class="titlebar-actions">
        <button class="close-btn" :style="{ color: theme.muted }" @click="closeWindow">&times;</button>
      </div>
    </div>

    <div class="tab-nav" :style="{ background: theme.inputBg }">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'general' }"
        :style="{ color: activeTab === 'general' ? theme.text : theme.muted }"
        @click="activeTab = 'general'"
      >通用设置</button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'about' }"
        :style="{ color: activeTab === 'about' ? theme.text : theme.muted }"
        @click="activeTab = 'about'"
      >关于</button>
    </div>

    <div class="tab-content">
      <div v-show="activeTab === 'general'" class="general-tab">
        <div class="setting-item" :style="{ background: theme.inputBg, borderColor: theme.border }">
          <div class="setting-info">
            <span class="setting-name" :style="{ color: theme.text }">开机自启动</span>
            <span class="setting-desc" :style="{ color: theme.muted }">系统启动时自动运行应用</span>
          </div>
          <label class="toggle">
            <input type="checkbox" :checked="autoStart" @change="toggleAutoStart" />
            <span class="toggle-slider" :class="{ 'is-light': !isDark }"></span>
          </label>
        </div>
      </div>

      <div v-show="activeTab === 'about'" class="about-tab">
        <div class="about-header">
          <img class="app-icon" src="../../build/icon.png" alt="App Icon" />
          <div class="app-name" :style="{ color: theme.text }">{{ appInfo.name }}</div>
        </div>
        <div class="info-list">
          <div class="info-row" :style="{ background: theme.inputBg, borderColor: theme.border }">
            <span class="info-label" :style="{ color: theme.muted }">版本</span>
            <span class="info-value" :style="{ color: theme.text }">v{{ appInfo.version }}</span>
          </div>
          <div class="info-row" :style="{ background: theme.inputBg, borderColor: theme.border }">
            <span class="info-label" :style="{ color: theme.muted }">开发者</span>
            <span class="info-value" :style="{ color: theme.text }">钞人本仁</span>
          </div>
        </div>
        <button class="update-btn" :style="{
          borderColor: isDark ? 'rgba(137, 180, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)',
          background: isDark ? 'rgba(137, 180, 250, 0.1)' : 'rgba(59, 130, 246, 0.08)',
          color: isDark ? '#89b4fa' : '#3b82f6',
        }" @click="checkUpdate">
          检查更新
        </button>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background: transparent;
  overflow: hidden;
  font-family: -apple-system, 'Microsoft YaHei', sans-serif;
}
</style>

<style scoped>
.settings-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 12px;
  border: 1px solid;
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  -webkit-app-region: drag;
}

.titlebar-label {
  font-size: 14px;
  font-weight: 600;
}

.titlebar-actions {
  display: flex;
  -webkit-app-region: no-drag;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8 !important;
}

.tab-nav {
  display: flex;
  margin: 0 16px;
  border-radius: 8px;
  padding: 3px;
}

.tab-btn {
  flex: 1;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  background: none;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.08);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.tab-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-name {
  font-size: 14px;
}

.setting-desc {
  font-size: 12px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #45475a;
  border-radius: 12px;
  transition: all 0.25s;
}

.toggle-slider.is-light {
  background: #d1d5db;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #bac2de;
  border-radius: 50%;
  transition: all 0.25s;
}

.toggle-slider.is-light::before {
  background: #fff;
}

.toggle input:checked + .toggle-slider {
  background: #89b4fa;
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
  background: #fff;
}

.about-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 24px;
}

.app-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  margin-bottom: 10px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid;
}

.info-label {
  font-size: 13px;
}

.info-value {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.tab-content::-webkit-scrollbar { width: 4px; }
.tab-content::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2); border-radius: 2px;
}

.update-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px 0;
  border: 1px solid;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.update-btn:hover {
  filter: brightness(1.2);
}
</style>
