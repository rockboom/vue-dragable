import { reactive } from "vue";

export interface CommandExecute {
    undo?: () => void;
    redo: () => void;
}

export interface Command {
    name: string;                                   // 命令唯一标识
    keyboard?: string | string[];                   // 命令监听的快捷键   
    execute: (...args: any[]) => CommandExecute;    // 命令被执行时，所做的事
    followQueue?: boolean;                          // 命令执行完后，是否要将命令执行得到的undo，redo放入命令队列
}

export function useCommander() {
    const state = reactive({
        current: -1,
        queue: [] as CommandExecute[],
        commands: {} as Record<string, (...args: any[]) => void>
    });

    const registry = (command: Command) => {
        state.commands[command.name] = (...args) => {
            const { undo, redo } = command.execute(...args);
            if (command.followQueue !== false) {
                state.queue.push({ undo, redo });
                state.current += 1;
            }
            redo();
        }
    }
    // 注册撤销事件
    registry({
        name: 'undo',
        keyboard: 'cmd+z',
        followQueue: false,
        execute: () => {
            // 命令被执行时，要做的事情
            return {
                redo: () => {
                    // 重新做一遍要做的事情
                    if(state.current === -1) return;
                    const queueItem = state.queue[state.current];
                    if(!!queueItem){
                        !!queueItem.undo && queueItem.undo();
                        state.current--;
                    }
                }
            }
        }
    })
    registry({
        name: 'redo',
        keyboard: [
            'ctrl+y',
            'cmd+shift+z'
        ],
        followQueue: false,
        execute: () => {
            return {
                redo: () => {
                    console.log("执行重做命令");
                    const queueItem = state.queue[state.current + 1];
                    if(!!queueItem){
                        queueItem.redo();
                        state.current++;
                    }
                }
            }
        }
    })
    return {
        state,
        registry
    }
}