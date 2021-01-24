import component from '*.vue';
import {computed, defineComponent, PropType} from 'vue';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import "./visual-editor.scss"
import { VisualEditorConfig, VisualEditorModelValue } from './visual-editor.utils';


export const VisualEditor = defineComponent({
    props:{
        modelValue: { type: Object as PropType<VisualEditorModelValue>,required:true},
        config: { type: Object as PropType<VisualEditorConfig>,required:true}

    },
    emits:{
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx){
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue',val));
        console.log("dataModel:",dataModel);
        const containerStyle = computed(()=>({
            width:`${dataModel.value.container.width}px`,
            height: `${dataModel.value.container.height}px`,
        }));
        console.log(props.config);
        return ()=>(
            <div class="visual-editor">
                <div class="visual-editor-menu">
                    {props.config.componentList.map(component => <div class="visual-editor-menu-item">
                        <span class="visual-editor-menu-item-label">{component.label}</span>
                        <div class="visual-editor-menu-item-content">
                            {component.preview()}
                        </div>
                    </div>)}
                </div>
                <div class="visual-editor-head">
                    visual-editor-head
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container" style={containerStyle.value}>
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