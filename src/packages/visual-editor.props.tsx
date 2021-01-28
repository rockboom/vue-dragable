import { VisualEditorSelectOptions } from "@/visual.config";

export enum VisualEditorPropsType {
    input = "input",
    color = "color",
    select = "select"
}
export type VisualEditorProps = {
    type: VisualEditorPropsType;
    label: string;
} & {
    options?: VisualEditorSelectOptions;
}