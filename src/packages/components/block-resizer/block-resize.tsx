import { VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig } from "@/packages/visual-editor.utils";
import { defineComponent, PropType } from "vue";
import "@/packages/visual-editor.scss"

export const BlockResize = defineComponent({
    props: {
        block: { type: Object as PropType<VisualEditorBlockData>, required: true },
        component: { type: Object as PropType<VisualEditorComponent>, required: true },
    },
    setup(props, ctx) {
        return () => {
            const { width, height } = props.component.resize || {};
            return <>
                {!!height && <>
                    <div class="block-resize block-resize-top"></div>
                    <div class="block-resize block-resize-bottom"></div></>}
                {!!width && <>
                    <div class="block-resize block-resize-left"></div>
                    <div class="block-resize block-resize-right"></div>
                </>}
                {!!width && !!height && <>
                    <div class="block-resize block-resize-top-left"></div>
                    <div class="block-resize block-resize-top-right"></div>
                    <div class="block-resize block-resize-bottom-left"></div>
                    <div class="block-resize block-resize-bottom-right"></div>
                </>}
            </>
        }
    }
})