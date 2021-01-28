import { computed, defineComponent, PropType, reactive, ref } from 'vue';
import { createEvent } from './plugins/event';
import { $$dialog } from './utils/dialog-service';
import { useModel } from './utils/useModel';
import { VisualEditorBlock } from './visual-editor-block';
import "./visual-editor.scss"
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorMarkLines, VisualEditorModelValue } from './visual-editor.utils';
import { useVisualCommand } from './visual.command';
import { ElMessageBox } from 'element-plus'
import { $$dropdown, DropdownOption } from './utils/dropdown-service';
import { VisualOperatorEditor } from './visual-editor-operator'

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
        const selectIndex = ref(-1);
        const state = reactive({
            selectBlock: computed(() => (dataModel.value.blocks || [])[selectIndex.value]),
            editing:false
        });

        const classes = computed(()=>[
            'visual-editor',
            {
                'visual-editor-editing':state.editing
            }
        ])

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
            updateBlocks: (blocks?: VisualEditorBlockData[]) => {
                dataModel.value = { ...dataModel.value, blocks };
            },
            showBlockData: (block: VisualEditorBlockData) => {
                $$dialog.textarea(JSON.stringify(block), "节点数据", { editReadonly: true });
            },
            importBlockData: async (block: VisualEditorBlockData) => {
                const text = await $$dialog.textarea('', '请输入JSON字符串');
                try {
                    const data = JSON.parse(text || '');
                    commander.updateBlock(data, block);
                } catch (error) {
                    console.error(error);
                    ElMessageBox.alert('解析JSON字符串出错');
                }
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
                        if (!state.editing) return;
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
                            selectIndex.value = -1;
                        }
                    }
                },
                block: {
                    onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
                        if (!state.editing) return;
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
                        selectIndex.value = index
                        blockDraggier.mousedown(e);
                    }
                }
            }
        })();

        /* 处理block在container中拖拽移动的相关动作 */
        const blockDraggier = (() => {
            const mark = reactive({
                x: null as null | number,
                y: null as null | number
            })

            let dragState = {
                startX: 0,
                startY: 0,
                startLeft: 0,
                startTop: 0,
                startPos: [] as { left: number; top: number }[],
                dragging: false,
                markLines: {} as VisualEditorMarkLines
            }

            const mousemove = (e: MouseEvent) => {
                if (!dragState.dragging) {
                    dragState.dragging = true;
                    dragstart.emit();
                }
                let { clientX: moveX, clientY: moveY } = e;
                let { startX, startY } = dragState;

                // 按住shift键，只能横向或纵向移动
                if (e.shiftKey) {
                    if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
                        moveY = startY;
                    } else {
                        moveX = startX;
                    }
                }
                const currentLeft = dragState.startLeft + moveX - startX;
                const currentTop = dragState.startTop + moveY - startY;
                const currentMark = {
                    x: null as null | number,
                    y: null as null | number
                }
                for (let i = 0; i < dragState.markLines.y.length; i++) {
                    const { top, showTop } = dragState.markLines.y[i];
                    if (Math.abs(top - currentTop) < 5) {
                        moveY = top + startY - dragState.startTop;
                        currentMark.y = showTop;
                        break;
                    }
                }
                for (let i = 0; i < dragState.markLines.x.length; i++) {
                    const { left, showLeft } = dragState.markLines.x[i];
                    if (Math.abs(left - currentLeft) < 5) {
                        moveX = left + startX - dragState.startLeft;
                        currentMark.x = showLeft;
                        break;
                    }
                }
                mark.x = currentMark.x;
                mark.y = currentMark.y;

                const durX = moveX - startX;
                const durY = moveY - startY;
                focusData.value.focus.forEach((block, index) => {
                    block.top = dragState.startPos[index].top + durY;
                    block.left = dragState.startPos[index].left + durX;
                })
            }
            const mouseup = (e: MouseEvent) => {
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                mark.x = null;
                mark.y = null;
                if (dragState.dragging) {
                    dragend.emit();
                }
            }

            const mousedown = (e: MouseEvent) => {
                dragState = {
                    startX: e.clientX,
                    startY: e.clientY,
                    startLeft: state.selectBlock!.left,
                    startTop: state.selectBlock!.top,
                    startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
                    dragging: false,
                    markLines: (() => {
                        const { focus, unFocus } = focusData.value;
                        const { top, left, width, height } = state.selectBlock!;
                        let lines: VisualEditorMarkLines = { x: [], y: [] };
                        [...unFocus, {
                            top: 0,
                            left: 0,
                            width: dataModel.value.container.width,
                            height: dataModel.value.container.height,
                        }].forEach((block) => {
                            const { top: t, left: l, width: w, height: h } = block;
                            lines.y.push({ top: t, showTop: t });                               // 1.顶部对齐顶部
                            lines.y.push({ top: t + h, showTop: t + h });                       // 2.顶部对齐底部
                            lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h / 2 });    // 3.中间对齐中间 垂直
                            lines.y.push({ top: t - height, showTop: t });                      // 4.底部对齐顶部
                            lines.y.push({ top: t + h - height, showTop: t + h });               // 5.底部对齐底部

                            lines.x.push({ left: l, showLeft: l });                               // 1.左边对齐左边
                            lines.x.push({ left: l + w, showLeft: l + w });                       // 2.左边对齐右边
                            lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w / 2 });    // 3.中间对齐中间 水平
                            lines.x.push({ left: l - width, showLeft: l });                      // 4.右边对齐左边
                            lines.x.push({ left: l + w - width, showLeft: l + w });               // 5.右边对齐右边
                        })
                        return lines;
                    })()
                }
                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);
            }
            return {
                mark,
                mousedown
            };
        })();

        /* 其他的一些事件 */
        const handler = {
            onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
                if (!state.editing) return;
                e.preventDefault();
                e.stopPropagation();
                $$dropdown({
                    reference: e,
                    content: () => <>
                        <DropdownOption label="置顶节点" icon="icon-place-top" {...{ onClick: commander.placeTop }} />
                        <DropdownOption label="置底节点" icon="icon-place-bottom" {...{ onClick: commander.placeBottom }} />
                        <DropdownOption label="删除节点" icon="icon-delete" {...{ onClick: commander.delete }} />
                        <DropdownOption label="查看数据" icon="icon-browse" {...{ onClick: () => { methods.showBlockData(block) } }} />
                        <DropdownOption label="导入节点" icon="icon-import" {...{ onClick: () => { methods.importBlockData(block) } }} />
                    </>
                })
            }
        }
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
                label:()=>state.editing ? '编辑':'预览',
                icon: () => state.editing ? 'icon-edit' : 'icon-browse',
                handler:()=>{
                    if(!state.editing){methods.clearFocus()}
                    state.editing = !state.editing;
                }
            },
            {
                label: '导入', icon: 'icon-import', handler: async () => {
                    const text = await $$dialog.textarea('', '请输入导入的JSON字符串');
                    try {
                        const data = JSON.parse(text || '');
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
                    const text = $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据', { editReadonly: true });
                    console.log("text:", text);

                }
            },
            { label: '置顶', icon: 'icon-place-top', handler: () => { commander.placeTop() }, tip: 'ctrl+up' },
            { label: '置底', icon: 'icon-place-bottom', handler: () => { commander.placeBottom() }, tip: 'ctrl+down' },
            { label: '删除', icon: 'icon-delete', handler: () => { commander.delete() }, tip: 'ctrl+d,backspace,delete' },
            { label: '清空', icon: 'icon-reset', handler: () => { commander.clear() } },
        ]

        return () => (
            <div class={classes.value}>
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
                            const label = typeof btn.label === "function" ? btn.label() : btn.label
                            const icon = typeof btn.icon === "function" ? btn.icon() : btn.icon
                            const content = (<div key={index} class="visual-editor-head-button" onClick={btn.handler}>
                                <i class={`iconfont ${icon}`}></i>
                                <span>{label}</span>
                            </div>);

                            return !btn.tip ? content : <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                                {content}
                            </el-tooltip>
                        })
                    }
                </div>
                <VisualOperatorEditor
                    block={state.selectBlock}
                    config={props.config}
                    dataModel={dataModel}
                    updateBlock={commander.updateBlock}
                    updateModelValue={commander.updateModelValue}
                />
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
                                            onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block, index),
                                            onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block)
                                        }
                                        }
                                    />
                                ))
                            )}
                            {blockDraggier.mark.y !== null && (
                                <div class="visual-editor-mark-line-y" style={{ top: `${blockDraggier.mark.y}px` }}></div>
                            )}
                            {blockDraggier.mark.x !== null && (
                                <div class="visual-editor-mark-line-x" style={{ left: `${blockDraggier.mark.x}px` }}></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>)
    }
});