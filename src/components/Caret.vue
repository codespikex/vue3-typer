<template>
  <span class="caret" :class="animation"></span>
</template>
<script lang="ts">
import {defineComponent} from "vue"

export default defineComponent({
  name: "VueTyperCaret",
  props: {
    /**
     * Caret animation similar to Sublime and VSCode: 'solid', 'blink', 'smooth', 'phase', 'expand'.
     */
    animation: {
      type: String,
      default: () => "blink",
      validator: (value: string) => /^solid$|^blink$|^smooth$|^phase$|^expand$/.test(value)
    }
  }
})
</script>
