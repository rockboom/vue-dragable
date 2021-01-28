import { Prop } from "vue";
import { VisualEditorProps } from "./visual-editor.props";

export interface VisualEditorBlockData {
    componentKey: string;               // 映射VisualEditorConfig 中 componentMap 的对象
    top: number;                        // 组件的top定位
    left: number;                       // 组件的left定位
    adjustPosition: boolean;            // 是否需要调整位置
    focus: boolean;                     // 是否是选中状态
    zIndex: number;                     // z-index值
    width: number;                      // 组件宽度
    height: number;                     // 组件高度
    hasResize: boolean;                 // 是否调整过宽度或高度
    props: Record<string, any>;           // 组件的设计属性
}
export interface VisualEditorModelValue {
    container: {
        width: number;
        height: number;
    };
    blocks?: VisualEditorBlockData[];
}

export interface VisualEditorComponent {
    key: string;
    label: string;
    preview: () => JSX.Element;
    render: (data: { props: any }) => JSX.Element;
    props?: Record<string, VisualEditorProps>;
}

export interface VisualEditorMarkLines {
    x: { left: number; showLeft: number }[];
    y: { top: number; showTop: number }[];
}

export function createNewBlock({
    component,
    left,
    top
}: {
    component: VisualEditorComponent;
    top: number;
    left: number;
}): VisualEditorBlockData {
    return {
        top,
        left,
        componentKey: component!.key,
        adjustPosition: true,
        focus: false,
        zIndex: 0,
        width: 0,
        height: 0,
        hasResize: false,
        props: {}
    }
}

export function createVisualEditorConfig() {
    const componentList: VisualEditorComponent[] = [];
    const componentMap: Record<string, VisualEditorComponent> = {};
    return {
        componentList,
        componentMap,
        registry: <Props extends Record<string, VisualEditorProps> = {}>(key: string, component: {
            label: string;
            preview: () => JSX.Element;
            render: (data: { props: { [k in keyof Props]: any } }) => JSX.Element;
            props?: Props;
        }) => {
            const comp = { ...component, key };
            componentList.push(comp); // 按照注册的顺序进行组件渲染
            componentMap[key] = comp;
        }
    }
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>;
