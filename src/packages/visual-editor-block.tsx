import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { VisualEditorBlockData, VisualEditorConfig } from "./visual-editor.utils";

export const VisualEditorBlock = defineComponent({
    props: {
        block: { type: Object as PropType<VisualEditorBlockData>, required: true },
        config: { type: Object as PropType<VisualEditorConfig>, required: true },
        formData: { type: Object as PropType<Record<string, any>>, required: true }
    },
    setup(props) {
        const el = ref({} as HTMLDivElement);

        const classes = computed(() => [
            'visual-editor-block',
            {
                'visual-editor-block-focus': props.block.focus
            }
        ])

        const styles = computed(() => ({
            top: `${props.block.top}px`,
            left: `${props.block.left}px`,
            zIndex: props.block.zIndex,
        }))
        onMounted(() => {
            /** 添加组件时，自动调整位置上下左右居中 */
            const block = props.block;
            if (block.adjustPosition === true) {
                const { offsetWidth, offsetHeight } = el.value;
                block.left = block.left - offsetWidth / 2;
                block.top = block.top - offsetHeight / 2;
                block.height = offsetHeight;
                block.width = offsetWidth;
                block.adjustPosition = false;
            }
        });
        return () => {
            const component = props.config.componentMap[props.block.componentKey];
            const formData = props.formData as Record<string,any>;
            const Render = component.render({
                props: props.block.props || {},
                model: Object.entries(props.block.model || {}).reduce((prev, [propName, modelName]) => {
                    prev[propName] = {
                        [propName === 'default' ? 'modelValue' : propName]: formData[modelName],
                        [propName === 'default' ? 'onUpdate:modelValue' : 'onChange']: (val: any) => {
                            formData[modelName] = val;
                        },
                    }
                    return prev;
                }, {} as Record<string, any>),
            });
            return (
                <div class={classes.value} style={styles.value} ref={el}>
                    {Render}
                </div>
            )
        }
    }
})