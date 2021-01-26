import { VisualEditorBlockData } from "../visual-editor.utils";

export function deepcopy(obj: VisualEditorBlockData[]) {
    let result: any[] = [];
    obj.forEach((item: VisualEditorBlockData, index: number) => {
        let block = {
            top:item.top,
            left:item.left,
            componentKey: item.componentKey,
            adjustPosition: item.adjustPosition,
            focus: item.focus
        }
        result.push(block);
    })
    return result;
    // return obj;
}