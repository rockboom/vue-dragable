import { onUnmounted, reactive } from "vue";

export interface CommandExecute {
    undo?: () => void;
    redo: () => void;
}

export interface Command {
    name: string;                                   // 命令唯一标识
    keyboard?: string | string[];                   // 命令监听的快捷键   
    execute: (...args: any[]) => CommandExecute;    // 命令被执行时，所做的事
    followQueue?: boolean;                          // 命令执行完后，是否要将命令执行得到的undo，redo放入命令队列
    init?: () => (() => void | undefined);          // 命令初始化函数
    data?: any;                                      // 
}

export function useCommander() {
    const state = reactive({
        current: -1,
        queue: [] as CommandExecute[],
        commandArray: [] as Command[],
        commands: {} as Record<string, (...args: any[]) => void>,
        destroyList: [] as ((() => void) | undefined)[]
    });

    const registry = (command: Command) => {
        state.commandArray.push(command);
        state.commands[command.name] = (...args) => {
            const { undo, redo } = command.execute(...args);
            redo();
            if (command.followQueue === false) {
                return;
            }
            let { queue, current } = state;
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1);   // 当前命令之前的都不要了，只要current后面的
                state.queue = queue;
            }
            queue.push({ undo, redo });
            state.current = current + 1;
        }
    }
    const init = () => {
        const onKeydown = (e: KeyboardEvent) => {
            // console.log("监听到键盘事件");

        }
        window.addEventListener('keydown', onKeydown);
        state.commandArray.forEach(command => !!command.init && state.destroyList.push(command.init()));
        state.destroyList.push(() => {
            window.removeEventListener('keydown', onKeydown);
        })
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
                    if (state.current === -1) return;
                    const queueItem = state.queue[state.current];
                    if (!!queueItem) {
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
                    // console.log("执行重做命令");
                    const queueItem = state.queue[state.current + 1];
                    if (!!queueItem) {
                        queueItem.redo();
                        state.current++;
                    }
                }
            }
        }
    })
    onUnmounted(() => {
        state.destroyList.forEach(fn => !!fn && fn());
    })
    return {
        state,
        registry,
        init
    }
}