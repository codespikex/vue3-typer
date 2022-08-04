<template>
  <div class="text-6xl flex items-center justify-center my-16">
    <VueTyper
        :text="['Vue', 'Vite', 'Vuepress', 'Vuex', 'VueRouter', 'Pinia', 'VueTyper']"
        caret-animation="phase"
    />
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue"
import VueTyper          from "~/index"

export default defineComponent({
  name: "App",
  components: {VueTyper}
})
</script>
