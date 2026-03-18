declare const originalEmit: {
    (event: "beforeExit", code: number): boolean;
    (event: "disconnect"): boolean;
    (event: "exit", code: number): boolean;
    (event: "rejectionHandled", promise: Promise<unknown>): boolean;
    (event: "uncaughtException", error: Error): boolean;
    (event: "uncaughtExceptionMonitor", error: Error): boolean;
    (event: "unhandledRejection", reason: unknown, promise: Promise<unknown>): boolean;
    (event: "warning", warning: Error): boolean;
    (event: "message", message: unknown, sendHandle: import("child_process").SendHandle): NodeJS.Process;
    (event: "workerMessage", value: any, source: number): NodeJS.Process;
    (event: NodeJS.Signals, signal?: NodeJS.Signals): boolean;
    (event: "multipleResolves", type: NodeJS.MultipleResolveType, promise: Promise<unknown>, value: unknown): NodeJS.Process;
    (event: "worker", listener: NodeJS.WorkerListener): NodeJS.Process;
};
