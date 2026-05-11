<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import ResizableImage from './ResizableImage'
import { ElDatePicker, ElConfigProvider } from 'element-plus'
// @ts-expect-error element-plus locale has no type declarations
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { THEME_PRESETS } from '../constants'
import type { ThemePreset } from '../types'

// @ts-ignore
import { useLogger } from '../composables/useLogger'

const log = useLogger('Editor')
const mode = ref('memo')
const title = ref('编辑备忘录')
const reminderTime = ref<string>('')
const memoId = ref<number | undefined>(undefined)

const theme = ref<ThemePreset>(THEME_PRESETS[0])

const isDark = computed(() => theme.value.name !== '纯白')

const editorWindowStyle = computed(() => ({
  background: theme.value.bg,
  borderColor: theme.value.border,
}))

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

function onThemeChanged(themeJson: string) {
  try {
    const parsed = JSON.parse(themeJson) as ThemePreset
    if (parsed && parsed.bg) theme.value = parsed
  } catch { /* ignore */ }
}

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ResizableImage,
  ],
  editorProps: {
    attributes: { class: 'tiptap-content' },
  },
})

function closeWindow() {
  window.editorAPI.close()
}

function onPickerOpen() {
  window.editorAPI?.resizeEditor?.(400, 600)
}

function onPickerClose() {
  window.editorAPI?.resizeEditor?.(400, 560)
}

function save() {
  if (!editor.value) return
  let rt: string | undefined = reminderTime.value || undefined
  if (rt && new Date(rt).getTime() <= Date.now()) {
    rt = undefined
  }
  window.editorAPI.save(editor.value.getHTML(), mode.value, rt)
  log.info(`Saved content (mode: ${mode.value}, reminder: ${rt || 'none'})`)
  // 延迟关闭，确保 IPC 消息发送完成
  setTimeout(closeWindow, 100)
}

async function addImage() {
  const src = await window.editorAPI.pickImage()
  if (src && editor.value) {
    editor.value.chain().focus().setImage({ src }).run()
    log.info('Image inserted')
  }
}

function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(() => {
  loadTheme()
  window.editorAPI.onThemeChanged(onThemeChanged)
  window.editorAPI.onInit(({ text, mode: m, memoId: mId, reminderTime: rt }) => {
    mode.value = m || 'memo'
    title.value = mode.value === 'todo' ? '编辑待办事项' : '编辑备忘录'
    memoId.value = mId
    reminderTime.value = rt || ''
    editor.value?.commands.setContent(text || '')
    setTimeout(() => editor.value?.commands.focus(), 50)
  })
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  editor.value?.destroy()
})
</script>

<template>
  <ElConfigProvider :locale="zhCn">
  <div class="editor-window" :style="editorWindowStyle">
    <div class="titlebar" :style="{ borderBottomColor: theme.border }">
      <span class="titlebar-label" :style="{ color: theme.muted }">{{ title }}</span>
      <div class="titlebar-actions">
        <button class="title-btn" :style="{ color: theme.muted }" @click="save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>
        <button class="close-btn" :style="{ color: theme.muted }" @click="closeWindow">&times;</button>
      </div>
    </div>
    <div class="toolbar" :style="{ borderBottomColor: theme.border }">
      <button class="tb-btn" :class="{ active: editor?.isActive('bold') }"
              :style="{ color: editor?.isActive('bold') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleBold().run()" title="粗体">
        <strong>B</strong>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive('italic') }"
              :style="{ color: editor?.isActive('italic') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleItalic().run()" title="斜体">
        <em>I</em>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive('underline') }"
              :style="{ color: editor?.isActive('underline') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleUnderline().run()" title="下划线">
        <u>U</u>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive('strike') }"
              :style="{ color: editor?.isActive('strike') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleStrike().run()" title="删除线">
        <s>S</s>
      </button>
      <span class="tb-sep" :style="{ background: theme.border }"></span>
      <button class="tb-btn" :class="{ active: editor?.isActive('heading', { level: 1 }) }"
              :style="{ color: editor?.isActive('heading', { level: 1 }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()" title="标题 1">H1</button>
      <button class="tb-btn" :class="{ active: editor?.isActive('heading', { level: 2 }) }"
              :style="{ color: editor?.isActive('heading', { level: 2 }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()" title="标题 2">H2</button>
      <button class="tb-btn" :class="{ active: editor?.isActive('heading', { level: 3 }) }"
              :style="{ color: editor?.isActive('heading', { level: 3 }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()" title="标题 3">H3</button>
      <span class="tb-sep" :style="{ background: theme.border }"></span>
      <button class="tb-btn" :class="{ active: editor?.isActive('bulletList') }"
              :style="{ color: editor?.isActive('bulletList') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleBulletList().run()" title="无序列表">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="3.5" cy="6" r="1.5" fill="currentColor"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="3.5" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive('orderedList') }"
              :style="{ color: editor?.isActive('orderedList') ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().toggleOrderedList().run()" title="有序列表">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/>
          <line x1="10" y1="18" x2="21" y2="18"/>
          <text x="2" y="8" font-size="8" fill="currentColor" stroke="none">1</text>
          <text x="2" y="14" font-size="8" fill="currentColor" stroke="none">2</text>
          <text x="2" y="20" font-size="8" fill="currentColor" stroke="none">3</text>
        </svg>
      </button>
      <span class="tb-sep" :style="{ background: theme.border }"></span>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
              :style="{ color: editor?.isActive({ textAlign: 'left' }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().setTextAlign('left').run()" title="左对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/>
          <line x1="3" y1="18" x2="18" y2="18"/>
        </svg>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
              :style="{ color: editor?.isActive({ textAlign: 'center' }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().setTextAlign('center').run()" title="居中">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'right' }) }"
              :style="{ color: editor?.isActive({ textAlign: 'right' }) ? (isDark ? '#89b4fa' : '#3b82f6') : theme.muted }"
              @click="editor?.chain().focus().setTextAlign('right').run()" title="右对齐">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/>
          <line x1="6" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <span class="tb-sep" :style="{ background: theme.border }"></span>
      <button class="tb-btn" :style="{ color: theme.muted }" @click="addImage" title="插入图片">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
    </div>
    <div class="reminder-bar" v-if="mode === 'memo'" :style="{ borderBottomColor: theme.border }">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reminder-icon">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <el-date-picker
        v-model="reminderTime"
        type="datetime"
        placeholder="设置提醒时间"
        format="MM-DD HH:mm"
        value-format="YYYY-MM-DDTHH:mm:ss"
        :disabled-date="(d: Date) => d.getTime() < new Date(new Date().setHours(0,0,0,0)).getTime()"
        clearable
        size="small"
        class="reminder-picker"
        :class="{ 'is-light': !isDark }"
        popper-class="reminder-popper"
        teleported
        @focus="onPickerOpen"
        @blur="onPickerClose"
      />
    </div>
    <EditorContent :editor="editor" class="editor-body" :style="{ color: theme.text }" />
  </div>
  </ElConfigProvider>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; background: transparent; }
body {
  font-family: -apple-system, 'Microsoft YaHei', sans-serif;
  display: flex; flex-direction: column;
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid;
  overflow: hidden;
  user-select: text;
}

.editor-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.titlebar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; -webkit-app-region: drag;
  border-bottom: 1px solid;
}
.titlebar-label { font-size: 12px; }
.titlebar-actions {
  display: flex; gap: 4px; -webkit-app-region: no-drag;
}
.title-btn, .close-btn {
  background: none; border: none; cursor: pointer;
  width: 24px; height: 24px; display: flex;
  align-items: center; justify-content: center;
  border-radius: 6px; transition: all 0.15s;
  font-size: 18px;
  -webkit-app-region: no-drag;
}
.title-btn:hover { opacity: 0.7; }
.close-btn:hover { background: rgba(243, 139, 168, 0.2); color: #f38ba8 !important; }

.toolbar {
  display: flex; align-items: center; gap: 2px;
  padding: 4px 10px;
  border-bottom: 1px solid;
  flex-wrap: wrap;
}
.tb-btn {
  background: none; border: none; cursor: pointer;
  width: 26px; height: 26px; display: flex;
  align-items: center; justify-content: center;
  border-radius: 4px; font-size: 12px;
  transition: all 0.15s;
}
.tb-btn:hover { background: rgba(128, 128, 128, 0.1); }
.tb-sep {
  width: 1px; height: 16px; margin: 0 4px;
}

.editor-body {
  flex: 1; overflow-y: auto; padding: 16px;
  font-size: 14px; line-height: 1.7;
}

.editor-body .tiptap-content { outline: none; min-height: 100%; }
.editor-body .tiptap-content p { margin: 0 0 0.5em; }
.editor-body .tiptap-content h1 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0 0.3em; }
.editor-body .tiptap-content h2 { font-size: 1.3em; font-weight: 600; margin: 0.4em 0 0.2em; }
.editor-body .tiptap-content h3 { font-size: 1.15em; font-weight: 600; margin: 0.3em 0 0.2em; }
.editor-body .tiptap-content ul,
.editor-body .tiptap-content ol { padding-left: 1.5em; margin: 0.3em 0; }
.editor-body .tiptap-content li { margin: 0.15em 0; }
.editor-body .tiptap-content img { max-width: 100%; border-radius: 6px; margin: 0.5em 0; }
.editor-body .tiptap-content blockquote {
  border-left: 3px solid rgba(137, 180, 250, 0.4);
  padding-left: 12px; margin: 0.5em 0; opacity: 0.7;
}
.editor-body .tiptap-content code {
  background: rgba(128, 128, 128, 0.15); border-radius: 3px;
  padding: 1px 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9em;
}
.editor-body .tiptap-content pre {
  background: rgba(0, 0, 0, 0.08); border-radius: 6px;
  padding: 10px; overflow-x: auto; margin: 0.5em 0;
}
.editor-body .tiptap-content pre code { background: none; padding: 0; }
.editor-body .tiptap-content hr {
  border: none; border-top: 1px solid rgba(128, 128, 128, 0.15); margin: 0.8em 0;
}
.editor-body .tiptap-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder); float: left; opacity: 0.4;
  pointer-events: none; height: 0;
}

.reminder-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-bottom: 1px solid;
}

.reminder-icon {
  color: #f9e2af;
  flex-shrink: 0;
}

/* Dark theme picker (default) */
.reminder-picker {
  flex: 1;
  --el-color-primary: #89b4fa;
  --el-fill-color-blank: rgba(255, 255, 255, 0.06);
  --el-border-color: rgba(255, 255, 255, 0.1);
  --el-text-color-regular: #cdd6f4;
  --el-text-color-placeholder: #585b70;
  --el-border-color-hover: rgba(137, 180, 250, 0.4);
  --el-border-radius-base: 6px;
  width: 100%;
}

.reminder-picker .el-input__wrapper {
  background: rgba(255, 255, 255, 0.06) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  border-radius: 6px !important;
  padding: 2px 8px !important;
}

.reminder-picker .el-input__inner {
  color: #cdd6f4 !important;
  font-size: 12px !important;
  font-family: inherit !important;
}

.reminder-picker .el-input__prefix .el-icon,
.reminder-picker .el-input__suffix .el-icon {
  color: #585b70 !important;
}

.reminder-picker .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.4) inset !important;
}

.reminder-picker .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.6) inset !important;
}

/* Light theme picker */
.reminder-picker.is-light {
  --el-color-primary: #3b82f6;
  --el-fill-color-blank: rgba(0, 0, 0, 0.04);
  --el-border-color: rgba(0, 0, 0, 0.12);
  --el-text-color-regular: #1e1e2e;
  --el-text-color-placeholder: #9ca3af;
  --el-border-color-hover: rgba(59, 130, 246, 0.4);
}

.reminder-picker.is-light .el-input__wrapper {
  background: rgba(0, 0, 0, 0.04) !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12) inset !important;
}

.reminder-picker.is-light .el-input__inner {
  color: #1e1e2e !important;
}

.reminder-picker.is-light .el-input__prefix .el-icon,
.reminder-picker.is-light .el-input__suffix .el-icon {
  color: #9ca3af !important;
}

.reminder-picker.is-light .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.4) inset !important;
}

.reminder-picker.is-light .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.6) inset !important;
}

.editor-body::-webkit-scrollbar { width: 4px; }
.editor-body::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2); border-radius: 2px;
}
</style>
