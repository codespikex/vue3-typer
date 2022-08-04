<template>
  <span class="char" :class="css">
    {{ char }}
  </span>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue"

export default defineComponent({
  name: "Char.vue",
  props: {
    char: {
      type: String,
      default: ""
    }
  },
  setup(props) {
    const css = computed(() => ({
      "newline": props.char.indexOf("\n") === 0
    }))

    return {
      css
    }
  }
})
</script>
