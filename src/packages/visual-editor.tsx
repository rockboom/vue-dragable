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
        console.log("dataModel:", dataModel);

        const containerRef = ref({} as HTMLDivElement);

        const containerStyle = computed(() => ({
            width: `${dataModel.value.container.width}px`,
            height: `${dataModel.value.container.height}px`,
        }));
        console.log(props.config);
        const menuDragier = {
            current: {
                component: null as null | VisualEditorComponent
            },
            dragstart: (e: DragEvent, component: VisualEditorComponent) => {
                containerRef.value.addEventListener('dragenter', menuDragier.dragenter);
                containerRef.value.addEventListener('dragover', menuDragier.dragover);
                containerRef.value.addEventListener('dragleave', menuDragier.dragleave);
                containerRef.value.addEventListener('drop', menuDragier.drop);
                menuDragier.current.component = component;
            },
            dragenter: (e: DragEvent) => {
                e.dataTransfer!.dropEffect = 'move';
            },
            dragover: (e: DragEvent) => {
                e.preventDefault();
            },
            dragleave: (e: DragEvent) => {
                e.dataTransfer!.dropEffect = 'none';
            },
            dragend:()=>{
                containerRef.value.removeEventListener('dragenter', menuDragier.dragenter);
                containerRef.value.removeEventListener('dragover', menuDragier.dragover);
                containerRef.value.removeEventListener('dragleave', menuDragier.dragleave);
                containerRef.value.removeEventListener('drop', menuDragier.drop);
                menuDragier.current.component = null;
            },
            drop: (e: DragEvent) => { 
                console.log("drop", menuDragier.current.component);
                const blocks = dataModel.value.blocks || [];
                blocks.push({
                    top:e.offsetY,
                    left:e.offsetX
                })
                dataModel.value = {...dataModel.value,blocks};
            },
        }
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