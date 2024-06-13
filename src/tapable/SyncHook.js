const Hook = require("./Hook.js");
const HookCodeFactory = require("./HookCodeFactory.js");

class SyncHookCodeFactory extends HookCodeFactory {
    content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
            onError: (i, err) => onError(err),
            onDone,
            rethrowIfPossible,
        })
    }
}

const factory = new SyncHookCodeFactory();

const TAP_ASYNC = () => {
    throw new Error("tapAsync is not supported on a SyncHook");
}

const TAP_PROMISE = () => {
    throw new Error("tapPromise is not supported on a SyncHook");
}

function COMPILE(options) {
    factory.setup(this, options);
    return factory.create(options);
}

function SyncHook(args = [], name = undefined) {
    const hook = new Hook(args, name);
    // 本来的constructor指向Hook
    hook.constructor = SyncHook;
    hook.tapAsync = TAP_ASYNC;
    hook.tapPromise = TAP_PROMISE;

    hook.compile = COMPILE;
    return hook;
}   

SyncHook.prototype = null;

module.exports = SyncHook;