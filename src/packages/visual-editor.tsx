import { computed, defineComponent, PropType, ref } from 'vue';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import "./visual-editor.scss"
import { VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue } from './visual-editor.utils';


export const VisualEditor = defineComponent({
    props: {
        modelValue: { type: Object as PropType<VisualEditorModelValue>, required: true },
        config: { type: Object as PropType<VisualEditorConfig>, required: true }
    },
    emits: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));

        const containerRef = ref({} as HTMLDivElement);

        const containerStyle = computed(() => ({
            width: `${dataModel.value.container.width}px`,
            height: `${dataModel.value.container.height}px`,
        }));
        const menuDragier = (() => {
            let component = null as null | VisualEditorComponent;
            const containerHandler = {
                /** 拖拽菜单组件，进入容器时，设置鼠标为可放置状态*/
                dragenter: (e: DragEvent) => { e.dataTransfer!.dropEffect = 'move'; },
                /** 拖拽菜单组件，鼠标在容器中运动时，禁用默认事件 */
                dragover: (e: DragEvent) => { e.preventDefault(); },
                /** 如果拖拽过程中，鼠标离开了容器，设置鼠标为不可放置状态*/
                dragleave: (e: DragEvent) => { e.dataTransfer!.dropEffect = 'none'; },
                /** 组件在容器中放置时，通过事件对象的offsetX 和 offsetY 添加一条组件数据*/
                drop: (e: DragEvent) => {
                    const blocks = dataModel.value.blocks || [];
                    blocks.push({ top: e.offsetY, left: e.offsetX })
                    dataModel.value = { ...dataModel.value, blocks };
                },
            }
            const blockHandler = {
                /**
                 * 处理拖拽菜单组件的开始动作
                 * @param e 
                 * @param current 
                 */
                dragstart: (e: DragEvent, current: VisualEditorComponent) => {
                    containerRef.value.addEventListener('dragenter', containerHandler.dragenter);
                    containerRef.value.addEventListener('dragover', containerHandler.dragover);
                    containerRef.value.addEventListener('dragleave', containerHandler.dragleave);
                    containerRef.value.addEventListener('drop', containerHandler.drop);
                    component = current;
                },
                /**
                 * 处理拖拽菜单组件的结束动作
                 */
                dragend: () => {
                    containerRef.value.removeEventListener('dragenter', containerHandler.dragenter);
                    containerRef.value.removeEventListener('dragover', containerHandler.dragover);
                    containerRef.value.removeEventListener('dragleave', containerHandler.dragleave);
                    containerRef.value.removeEventListener('drop', containerHandler.drop);
                    component = null;
                },
            }

            return blockHandler;
        })()
        return () => (
            <div class="visual-editor">
                <div class="visual-editor-menu">
                    {props.config.componentList.map(component => (
                        <div class="visual-editor-menu-item"
                            draggable
                            onDragend={menuDragier.dragend}
                            onDragstart={(e) => menuDragier.dragstart(e, component)}>
                            <span class="visual-editor-menu-item-label">{component.label}</span>
                            <div class="visual-editor-menu-item-content">
                                {component.preview()}
                            </div>
                        </div>))}
                </div>
                <div class="visual-editor-head">
                    visual-editor-head
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container" style={containerStyle.value} ref={containerRef}>
                            {!!dataModel.value.blocks && (
                                dataModel.value.blocks.map((block, index) => (
                                    <VisualEditorBlock block={block} key={index} />
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </div>
        )
    }
});