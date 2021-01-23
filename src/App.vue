<template>
    <div class="app">
        <h1>这是渲染页面</h1>
        <visual-editor />
    </div>
</template>

<script lang="tsx">
import { defineComponent } from 'vue'
import { VisualEditor } from '@/packages/visual-editor.tsx'
export default defineComponent({
    name: 'App',
    components: {
        VisualEditor,
    },
})
</script>

<style lang="scss">
</style>
