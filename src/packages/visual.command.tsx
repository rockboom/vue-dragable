import { useCommander } from "@/packages/plugins/command.plugin";
import { VisualEditorBlockData, VisualEditorModelValue } from "./visual-editor.utils";

export function useVisualCommand({
    focusData,
    updateBlocks,
    dataModel
}: {
    focusData: { value: { focus: VisualEditorBlockData[]; unFocus: VisualEditorBlockData[] } };
    updateBlocks: (blocks: VisualEditorBlockData[]) => void;
    dataModel: { value: VisualEditorModelValue };
}) {
    const commander = useCommander();
    commander.registry({
        name: 'delete',
        keyboard: [
            'backspace',
            'delete',
            'cmd+d'
        ],
        execute: () => {
            console.log("执行删除命令");
            const data = {
                before: dataModel.value.blocks || [],
                after: focusData.value.unFocus
            }
            return {
                redo: () => {
                    console.log("重做删除命令",data.after);
                    updateBlocks(data.after);
                },
                undo: () => {
                    console.log("撤回删除命令");
                    updateBlocks(data.before);
                }
            }
        }
    });
    return {
        undo: () => commander.state.commands.undo(),
        redo: () => commander.state.commands.redo(),
        delete: () => commander.state.commands.delete(),
    }
}