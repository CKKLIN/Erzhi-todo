<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps(nodeViewProps)
const containerRef = ref<HTMLDivElement>()
let isResizing = false
let startX = 0
let startWidth = 0

function onMouseDown(e: MouseEvent) {
  e.preventDefault()
  isResizing = true
  startX = e.clientX
  startWidth = containerRef.value!.offsetWidth
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!isResizing || !containerRef.value) return
  const diff = e.clientX - startX
  const newWidth = Math.max(60, startWidth + diff)
  containerRef.value.style.width = newWidth + 'px'
  containerRef.value.style.height = 'auto'
  props.updateAttributes({ width: newWidth })
}

function onMouseUp() {
  isResizing = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <NodeViewWrapper as="div" class="resizable-image-wrapper">
    <div
      ref="containerRef"
      class="resizable-image-container"
      :style="node.attrs.width ? { width: node.attrs.width + 'px' } : {}"
    >
      <img :src="node.attrs.src" :alt="node.attrs.alt || ''" />
      <div class="resize-handle" @mousedown="onMouseDown"></div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.resizable-image-wrapper {
  display: inline-block;
  margin: 0.5em 0;
  max-width: 100%;
}
.resizable-image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}
.resizable-image-container img {
  display: block;
  max-width: 100%;
  border-radius: 6px;
  height: auto;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.15s;
  background: linear-gradient(135deg, transparent 50%, rgba(137, 180, 250, 0.5) 50%);
  border-radius: 0 0 6px 0;
}
.resizable-image-container:hover .resize-handle {
  opacity: 1;
}
</style>
