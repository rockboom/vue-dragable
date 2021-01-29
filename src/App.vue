<template>
    <div class="app">
        <h1>这是渲染页面</h1>
        <visual-editor v-model="jsonData" :config="visualConfig" :formData="formData"/>
        <div style="text-align:center">
            {{JSON.stringify(formData)}}
        </div>
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
            formData:{
                username:'admin'
            }
        }
    },
})
</script>

<style lang="scss">
    html,body{
        margin: 0;
        border: 0;
    }
    .app{
        padding-bottom: 300px;
    }
</style>
