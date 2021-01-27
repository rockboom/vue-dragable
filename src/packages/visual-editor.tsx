import { computed, defineComponent, PropType, ref } from 'vue';
import { createEvent } from './plugins/event';
import { $$dialog } from './utils/dialog-service';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import "./visual-editor.scss"
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue } from './visual-editor.utils';
import { useVisualCommand } from './visual.command';
import {ElMessageBox} from 'element-plus'


export const VisualEditor = defineComponent({
    props: {
        modelValue: { type: Object as PropType<VisualEditorModelValue>, required: true },
        config: { type: Object as PropType<VisualEditorConfig>, required: true }
    },
    emits: {
        'update:modelValue': (val?: VisualEditorModelValue) => true,
    },
    setup(props, ctx) {
        /* 双向绑定至，容器中的组件数据 */
        const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));

        /* container结点对象的引用 */
        const containerRef = ref({} as HTMLDivElement);

        /* container节点的style样式对象 */
        const containerStyle = computed(() => ({
            width: `${dataModel.value.container.width}px`,
            height: `${dataModel.value.container.height}px`,
        }));

        /* 计算选中与为选中的block状态 */
        const focusData = computed(() => {
            const focus: VisualEditorBlockData[] = [];
            const unFocus: VisualEditorBlockData[] = [];
            (dataModel.value.blocks || []).forEach(block => (block.focus ? focus : unFocus).push(block));
            return {
                focus,      // 此时选中的数据
                unFocus     // 此时未选中的数据
            }
        })

        const dragstart = createEvent();
        const dragend = createEvent();
        dragstart.on(() => {
            // console.log("listen drag start");

        })
        dragend.on(() => {
            // console.log("listen end start");

        })

        /* 对外暴露的一些方法 */
        const methods = {
            clearFocus: (block?: VisualEditorBlockData) => {
                let blocks = (dataModel.value.blocks || []);
                if (blocks.length === 0) return;
                if (!!block) {
                    blocks = blocks.filter((item) => item != block);
                }
                blocks.forEach(block => block.focus = false);
            },
            updateBlocks: (blocks: VisualEditorBlockData[]) => {
                dataModel.value = { ...dataModel.value, blocks };
            }
        }

        /* 处理从菜单拖拽组件到容器的相关动作 */
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
                    const blocks = [...dataModel.value.blocks || []];
                    blocks.push(createNewBlock({
                        component: component!,
                        top: e.offsetY,
                        left: e.offsetX
                    }));
                    methods.updateBlocks(blocks);
                    dragend.emit();
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
                    dragstart.emit();
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
        })();

        /* 处理block选中的相关动作 */
        const focusHandler = (() => {
            return {
                container: {
                    onMousedown: (e: MouseEvent) => {
                        /* 此行导致报错：Uncaught TypeError: Cannot read property 'target' of undefined
                            因为element-ui有代码在冒泡阶段，监听全局点击事件 阻止冒泡 不能获取e.target 报错
                        */
                        // e.stopPropagation();
                        e.preventDefault();
                        // 只处理点击的容器的事件，不处理点击元素的事件 如点击按钮的文本就不处理 只有点击边框才会处理
                        if (e.currentTarget !== e.target) return;
                        if (!e.shiftKey) {
                            /* 点击空白处，清空所有选中的block */
                            methods.clearFocus();
                        }
                    }
                },
                block: {
                    onMousedown: (e: MouseEvent, block: VisualEditorBlockData) => {
                        /* 此行导致报错：Uncaught TypeError: Cannot read property 'target' of undefined
                            因为element-ui有代码在冒泡阶段，监听全局点击事件 阻止冒泡 不能获取e.target 报错
                        */
                        // e.stopPropagation();
                        // e.preventDefault();
                        if (e.shiftKey) {
                            /* 按住了shift键，如果此时没有选中的block，就选中这个block，否则就令这个block的选中状态取反 */
                            if (focusData.value.focus.length <= 1) {
                                block.focus = true;
                            } else {
                                block.focus = !block.focus;
                            }
                        } else {
                            /* 如果点击的这个block没有被选中，才清空其他被选中的block，否则不做任何处理。防止拖动多个block，取消其他block的选中状态 */
                            if (!block.focus) {
                                block.focus = true;
                                methods.clearFocus(block);
                            }
                        }
                        blockDraggier.mousedown(e);
                    }
                }
            }
        })();

        /* 处理block在container中拖拽移动的相关动作 */
        const blockDraggier = (() => {
            let dragState = {
                startX: 0,
                startY: 0,
                startPos: [] as { left: number; top: number }[],
                dragging: false
            }

            const mousemove = (e: MouseEvent) => {
                const durX = e.clientX - dragState.startX;
                const durY = e.clientY - dragState.startY;
                if (!dragState.dragging) {
                    dragState.dragging = true;
                    dragstart.emit();
                }
                focusData.value.focus.forEach((block, index) => {
                    block.top = dragState.startPos[index].top + durY;
                    block.left = dragState.startPos[index].left + durX;
                })
            }
            const mouseup = (e: MouseEvent) => {
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                if (dragState.dragging) {
                    dragend.emit();
                }
            }

            const mousedown = (e: MouseEvent) => {
                dragState = {
                    startX: e.clientX,
                    startY: e.clientY,
                    startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
                    dragging: false
                }
                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);
            }
            return { mousedown };
        })();
        const commander = useVisualCommand({
            focusData,
            updateBlocks: methods.updateBlocks,
            dataModel,
            dragstart,
            dragend
        });
        const buttons = [
            { label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z' },
            { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+shift+z' },
            {
                label: '导入', icon: 'icon-import', handler: async () => {
                    const text = await $$dialog.textarea('','请输入导入的JSON字符串');
                    try {
                        const data = JSON.parse(text ||'');
                        dataModel.value = data;
                    } catch (error) {
                        console.error(error);
                        ElMessageBox.alert('解析JSON字符串出错');
                    }
                }
            },
            {
                label: '导出', 
                icon: 'icon-export', 
                handler: async () => {
                    const text = $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据',{editReadonly:true});
                    console.log("text:", text);

                }
            },
            { label: '删除', icon: 'icon-delete', handler: () => { commander.delete() }, tip: 'ctrl+d,backspace,delete' },
            { label: '清空', icon: 'icon-reset', handler: () => { commander.clear() } },
        ]

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
                    {
                        buttons.map((btn, index) => {
                            const content = (<div key={index} class="visual-editor-head-button" onClick={btn.handler}>
                                <i class={`iconfont ${btn.icon}`}></i>
                                <span>{btn.label}</span>
                            </div>);

                            return !btn.tip ? content : <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                                {content}
                            </el-tooltip>
                        })
                    }
                </div>
                <div class="visual-editor-operator">
                    visual-editor-operator
                </div>
                <div class="visual-editor-body">
                    <div class="visual-editor-content">
                        <div class="visual-editor-container"
                            style={containerStyle.value}
                            ref={containerRef}
                            {...focusHandler.container}
                        >
                            {!!dataModel.value.blocks && (
                                dataModel.value.blocks.map((block, index) => (
                                    <VisualEditorBlock
                                        config={props.config}
                                        block={block}
                                        key={index}
                                        {
                                        ...{
                                            onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block)
                                        }
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>)
    }
});