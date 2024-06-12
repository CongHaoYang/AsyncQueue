/**
 * https://juejin.cn/post/7052609791641780260 asyncQueue
 * https://juejin.cn/post/7049385716765163534 eventloop
 */

class AsyncQueue {
    constructor(options) {
        this.options = options;
        // 名字
        this.name = options.name;
        // 处理函数
        this.processor = options.processor;
        // 并发执行最大数
        this.parallelism = options.parallelism || 100;
        // 唯一标示函数
        this.getKey = options.getKey;
        // 保存当前队列中等待执行的任务
        this._queued = new ArrayQueue();
        // 保存当前队列中所有已经执行的任务
        this._entries = new Map();
        // 当前并发任务
        this._activeTasks = 0;
        // 是否开启下次事件队列EventLoop中等待执行的函数
        this._willEnsureProcessing = false;
        // 队列是否已经结束
        this._stopped = false;
    }

    // 添加任务时
    add(item, callback) {
        if (this._stopped) {
            return callback(new Error("Queue was stopped"));
        }
        // 获取当前添加的唯一key
        const key = this.getKey(item);

        const entry = this._entries.get(key);
        if (entry !== undefined) {
            if (entry.state === DONE_STATE) {
                process.nextTick(() => callback(entry.error, entry.result));
            } else if (entry.callbacks === undefined) {
                entry.callbacks = [callback];
            } else {
                entry.callbacks.push(callback);
            }
            return;
        }

        const newEntry = new AsyncQueueEntry(item, callback);

        this._entries.set(key, newEntry);
        // Task入队
        this._queued.enqueue(newEntry);

        // _willEnsureProcessing为false表示下次EventLoop中并不会调用调用器执行任务
        // 当_willEnsureProcessing为false时我们需要在下一次EventLoop中执行调度器中的任务
        // 并且将_willEnsureProcessing设置为true，防止本次EventLoop多次add造成下次EventLoop中多次重复执行任务
        if (!this._willEnsureProcessing) {
            this._willEnsureProcessing = true;
            // 下一次EventLoop中调用_ensureProcessing执行调度器中的任务
            setImmediate(this._ensureProcessing.bind(this));
        }
    }

    _ensureProcessing() {
        while(this._activeTasks < this.parallelism) {
            const entry = this._queued.dequeue();
            if (entry === undefined) break;

            this._activeTasks++;
            entry.state = PROCESSING_STATE;
            this._startProcess(entry);
            
        }

        this._willEnsureProcessing = false;
    }

    _startProcess(entry) {
        this.processor(entry.item, (e, r) => {
            if(e) {
                this._handleResult(
                    entry,
                    new Error(`AsyncQueue(${this.name} processor error.)`)
                );
            }

            this._handleResult(entry, e, r);
        })
    }

    _handleResult(entry, e, r) {
        const callback = entry.callback;
        const callbacks = entry.callbacks;
        entry.state = DONE_STATE;
        entry.callback = undefined;
        entry.callbacks = undefined;
        entry.result = r;
        entry.error = e;
        this._activeTasks--;
        callback(e, r);
        if (callbacks !== undefined) {
            for (const callback of callbacks) {
              callback(e, r);
            }
        }
        // 当调度器任务完成时
        // 如果下一次EventLoop中并没有安排调度器执行
        // 那么重置this._willEnsureProcessing状态 开启调度器执行
        if (!this._willEnsureProcessing) {
            this._willEnsureProcessing = true;
            setImmediate(this._ensureProcessing.bind(this));
        }
    }
}

class ArrayQueue {
    constructor(items) {
        this._list = items ? Array.from(items) : [];
    }
    // 入队
    enqueue(item) {
        this._list.push(item);
    }
    // 出队
    dequeue() {
        return this._list.shift();
    }
}
// 还未执行
const QUEUED_STATE = 0;
// 正在处理
const PROCESSING_STATE = 1;
// 处理完成
const DONE_STATE = 2;

class AsyncQueueEntry {
    constructor(item, callback) {
        this.item = item;

        this.state = QUEUED_STATE;

        this.callback = callback;

        this.callbacks = undefined;

        this.result = undefined;

        this.error = undefined;
    }
}

module.exports = AsyncQueue;