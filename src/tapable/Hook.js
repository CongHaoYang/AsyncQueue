const CALL_DELEGATE = function(...args) {
    this.call = this._createCall("sync");
    return this.call(...args);
}

class Hook {
    constructor(args = [], name = undefined) {
        // 保存初始化hook时候传的参数
        this._args = args;
        this.name = name;
        // 保存所有taps注册的内容
        this.taps = [];
        // 保存拦截器相关内容
        this.interceptors = [];
        // hook call的调用
        this._call = CALL_DELEGATE; // 调用hook.call时候才会懒动态编译
        this.call = CALL_DELEGATE;
        // _x存放hook中所有通过tap注册的函数
        this._x = undefined;

        // 动态编译方法
        this.compile = this.compile;
        // 相关注册方法
        this.tap = this.tap;
    }

    compile(options) {
        throw new Error("Abstract: should be override");
    }

    tap(options, fn) {
        this._tap("sync", options, fn);
    }

    _tap(type, options, fn) {
        if (typeof options === 'string') {
            options = {
                name: options.trim()
            }
        } else if (typeof options !== 'object' || options === null) {
            // 如果非对象或者传入null
            throw new Error('Invalid tap options');
        }

        // 那么此时剩下的options类型仅仅就只有object类型了
        if (typeof options.name !== 'string' || options.name === '') {
            // 如果传入的options.name 不是字符串 或者是 空串
            throw new Error('Missing name for tap');
        }

        options = Object.assign({type, fn}, options);

        this._insert(options)
    }

    _insert(item) {
        // 每次tap都会调用_resetCompilation重新赋值this.call
        this._resetCompilation();
        this.taps.push(item)
    }

    _resetCompilation() {
        this.call = this._call;
    }

    _createCall(type) {
        return this.compile({
            taps: this.taps,
            args: this._args,
            type: type
        })
    }
}

module.exports = Hook;