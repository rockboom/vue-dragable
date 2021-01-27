<template>
    <div class="app">
        <h1>这是渲染页面</h1>
        <visual-editor v-model="jsonData" :config="visualConfig" />
    </div>
</template>

<script lang="tsx">
import { defineComponent } from 'vue'
import { VisualEditor } from '@/packages/visual-editor.tsx'
import { visualConfig } from './visual.config'
import jsonData from './data.json'

export default defineComponent({
    name: 'App',
    components: {
        VisualEditor,
    },
    data() {
        return {
            visualConfig,
            jsonData,
        }
    },
})
</script>

<style lang="scss">
</style>
