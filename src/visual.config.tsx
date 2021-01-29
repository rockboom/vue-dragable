import { createVisualEditorConfig } from "./packages/visual-editor.utils";
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus';
import { VisualEditorProps, VisualEditorPropsType } from "./packages/visual-editor.props";
import { NumberRange } from "./packages/components/number-range/number-range";
export const visualConfig = createVisualEditorConfig();
import "./visual.config.scss"

visualConfig.registry('text', {
    label: '文本',
    preview: () => '预览文本',
    render: ({ props }) => <span style={{ color: props.color, fontSize: props.size }}>{props.text || '默认文本'}</span>,
    props: {
        text: createEditorInputProp('显示文本'),
        color: createEditorColorProp('字体颜色'),
        size: createEditorSelectProp('字体大小', [
            { label: '14px', val: '14px' },
            { label: '18px', val: '18px' },
            { label: '24px', val: '24px' },
        ])
    }
})

visualConfig.registry('button', {
    label: '按钮',
    preview: () => <ElButton>按钮</ElButton>,
    render: ({ props }) => <ElButton type={props.type} size={props.size}>
        {props.text || '按钮'}
    </ElButton>,
    props: {
        text: createEditorInputProp('显示文本'),
        color: createEditorColorProp('字体颜色'),
        type: createEditorSelectProp('按钮类型', [
            { label: '基础', val: 'primary' },
            { label: '成功', val: 'success' },
            { label: '警告', val: 'warning' },
            { label: '危险', val: 'danger' },
            { label: '提示', val: 'danger' },
            { label: '文本', val: 'text' },
        ]),
        size: createEditorSelectProp('按钮大小', [
            { label: '默认', val: '' },
            { label: '中等', val: 'medium' },
            { label: '小', val: 'small' },
            { label: '极小', val: 'mini' },
        ])
    }
})

visualConfig.registry('select', {
    label: '下拉框',
    preview: () => <ElSelect />,
    render: ({ props,model }) => (
        <ElSelect key={(props.options || []).map((opt: any) => opt.value).join(',')} {...model.default}>
            {(props.options || []).map((opt: { label: string; value: string }, index: string) => {
                return (<ElOption label={opt.label} value={opt.value} key={index} />)
            })}
        </ElSelect>
    ),
    props: {
        options: createEditorTableProp('下拉选项', {
            options: [
                { label: '显示值', field: 'label' },
                { label: '绑定值', field: 'value' },
                { label: '备注', field: 'comments' },
            ],
            showKey: 'label'
        })
    },
    model: {
        default: '绑定字段'
    }
})

visualConfig.registry('input', {
    label: '输入框',
    preview: () => <ElInput modelValue={""}/>,
    render: ({model}) => {
        return (<ElInput {...model.default}/>)
    },
    model:{
        default:'绑定字段'
    }
})

visualConfig.registry('number-range',{
    label:"数字范围输入框",
    preview:()=><NumberRange style={{width:'100%'}}/>,
    render:({model})=><NumberRange
    {...{
        start:model.start.value,
        'onUpdate:start':model.start.onChange,
        end:model.end.value,
        'onUpdate:end':model.end.onChange,
    }}
    />,
    model:{
        start:"起始绑定字段",
        end:"结束绑定字段"
    }

})


// input
export function createEditorInputProp(label: string): VisualEditorProps {
    return {
        type: VisualEditorPropsType.input,
        label,
    }
}

// color
export function createEditorColorProp(label: string): VisualEditorProps {
    return {
        type: VisualEditorPropsType.color,
        label,
    }
}

// select
export type VisualEditorSelectOptions = {
    label: string;
    val: string;
}[]

export function createEditorSelectProp(label: string, options: VisualEditorSelectOptions): VisualEditorProps {
    return {
        type: VisualEditorPropsType.select,
        label,
        options,
    }
}

// table
export type VisualEditorTableOption = {
    options: {
        label: string;   // 列显示文本
        field: string;   // 列绑定字段
    }[];
    showKey: string;
}

export function createEditorTableProp(label: string, option: VisualEditorTableOption): VisualEditorProps {
    return {
        type: VisualEditorPropsType.table,
        label,
        table: option,
    }
}