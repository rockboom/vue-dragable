import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { VisualEditorBlockData, VisualEditorConfig } from "./visual-editor.utils";

export const VisualEditorBlock = defineComponent({
    props: {
        block: { type: Object as PropType<VisualEditorBlockData>, required: true },
        config: { type: Object as PropType<VisualEditorConfig>, required: true }
    },
    setup(props) {
        const el = ref({} as HTMLDivElement);
        const styles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
        }))
        onMounted(() => {
            /** 添加组件时，自动调整位置上下左右居中 */
            const block = props.block;
            if (block.adjustPosition === true) {
                const {offsetWidth,offsetHeight} = el.value;
                block.left = block.left - offsetWidth/2;
                block.top = block.top - offsetHeight/2;
                block.adjustPosition = false;
            }
        });
        return () => {
            const component = props.config.componentMap[props.block.componentKey];
            const Render = component.render();
            return (
                <div class="visual-editor-block" style={styles.value} ref={el}>
                    {Render}
                </div>
            )
        }
    }
})