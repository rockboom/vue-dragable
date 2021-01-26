# 命令队列及其对应的快捷键
大致的思路是用一个对象，此对象可以用来注册命令，同时命令也有自己的生命周期
- 命令初始化：需要拿到一些数据，如当前选中的节点
- 命令销毁

## 命令的接口
```ts
export interface CommandExecute {
    undo: () => void;   // 撤销一个行为 cmd + z
    redo: () => void;   // 重做一个行为 cmd + shift + z
}

export interface Command {
    name: string;                                   // 命令唯一标识
    keyboard?: string | string[];                   // 命令监听的快捷键   
    execute: (...args: any[]) => CommandExecute;    // 命令被执行时，所做的事
    followQueue?: boolean;                          // 命令执行完后，是否要将命令执行得到的undo，redo放入命令队列
}
```
