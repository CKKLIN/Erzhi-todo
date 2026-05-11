import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ResizableImageView from './ResizableImageView.vue'

export default Image.extend({
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageView)
  },
}).configure({ inline: true, allowBase64: true })
