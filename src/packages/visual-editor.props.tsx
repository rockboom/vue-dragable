import { VisualEditorSelectOptions, VisualEditorTableOptions } from "@/visual.config";

export enum VisualEditorPropsType {
    input = "input",
    color = "color",
    select = "select",
    table = "table",
}
export type VisualEditorProps = {
    type: VisualEditorPropsType;
    label: string;
} & {
    options?: VisualEditorSelectOptions;
} & {
    table?: VisualEditorTableOptions;
}