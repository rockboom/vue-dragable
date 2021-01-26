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
    data?: any;                                     // 命令缓存所需要的数据
}

export function useCommander() {
    const state = reactive({
        current: -1,                                                // 对列中当前的命令
        queue: [] as CommandExecute[],                              // 命令队列
        commandArray: [] as Command[],                              // 命令对象数组
        commands: {} as Record<string, (...args: any[]) => void>,   // 命令对象，方便通过命令的名称调用命令的execute函数，并执行额外的命令队列
        destroyList: [] as ((() => void) | undefined)[]             // 组件销毁的时候，需要调用
    });

    const registry = (command: Command) => {
        state.commandArray.push(command);
        state.commands[command.name] = (...args) => {
            const { undo, redo } = command.execute(...args);
            redo();
            /* 如果命令执行结束后，不需要进入命令队列，则直接结束 */
            if (command.followQueue === false) {
                return;
            }

            /* 否则，将命令队列中的剩余命令去掉，保留current后面的 */
            let { queue, current } = state;
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1);   // 当前命令之前的都不要了，只要current后面的
                state.queue = queue;
            }
            /* 设置命令队列中的最后一个为当前执行的命令 */
            queue.push({ undo, redo });
            /* 索引+1 指向命令队列中的最后一个命令 */
            state.current = current + 1;
        }
    }

    /**
     * useCommander初始化函数，负责初始化监听键盘事件、命令的初识话逻辑
     */
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
    // 注册撤销命令 (撤回命令的执行结果不需要进队列 ？)
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