class HookCodeFactory {
    constructor(config) {
        this.config = config;
        this.options = undefined;
        this._args = undefined;
    }

    /**
     * 
     * {
     *    taps: this.taps,
     *    interceptors: this.interceptors,
     *    args: this._args,
     *    type: type,
     * }
     */
    // 初始化
    setup(instance, options) {
        instance._x = options.taps.map(i => i.fn);
    }

    init(options) {
        this.options = options;
        this._args = options.args.slice();
    }

    deinit(options) {
        this.options = undefined;
        this._args = undefined;
    }

    args({ before, after } = {}) {
        let allArgs = this._args;
        if (before) allArgs = [before].concat(allArgs);
        if (after) allArgs = allArgs.concat(after);
        if (allArgs.length == 0) {
            return '';
        } else {
            return allArgs.join(', ')
        }
    }

    header() {
        let code = '';
        // this.needContext()是false context api 已经快要被废弃掉了
        // if (this.needContext()) {
        //     code += 'var _context = {};\n';
        // } else {
        //     code += 'var _context;\n';
        // }
        code += 'var _context;\n';
        code += 'var _x = this._x;\n';
        // // 并不存在拦截器
        // if (this.options.interceptors.length > 0) {
        //     code += 'var _taps = this.taps;\n';
        //     code += 'var _interceptors = this.interceptors;\n';
        // }
        return code;
    }

    contentWithInterceptors(options) {
        // 如果存在拦截器
          if (this.options.interceptors?.length > 0) {
              // ...
          }else {
              return this.content(options);
          }
    }

    // 编译最终需要的函数
    create(options) {
        this.init(options);
        // 最终编译生成的函数
        let fn;
        switch(this.options.type) {
            case 'sync':
                fn = new Function(
                    this.args(), 
                    '"use strict";\n' +
                    this.header() +
                    this.contentWithInterceptors({
                        onError: (err) => `throw ${err};\n`,
                        onResult: (result) => `return ${result};\n`,
                        resultReturns: true,
                        onDone: () => '',
                        rethrowIfPossible: true,
                    })
                )
                break;
            default:
                break;
        }
        this.deinit;
        return fn;
    }

    // 根据this._x生成整体函数内容
    callTapsSeries({ onDone }) {
        let code = "";
        let current = onDone;
        if (this.options.taps.length === 0) return onDone();
        for (let i = this.options.taps.length - 1; i >= 0; i--) {
            const done = current;
            const content = this.callTap(i, {
                onDone: done,
            });
            current = () => content;
        }
        code += current();
        return code;
    }

    callTap(tapIndex, { onDone }) {
        let code = '';
        code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
        const tap = this.options.taps[tapIndex];
        switch (tap.type) {
            case 'sync':
              code += `_fn${tapIndex}(${this.args()});\n`;
              break;
            // 其他类型不考虑
            default:
              break;
        }
        if (onDone) {
            code += onDone();
        }
        return code;
    }

    getTapFn(idx) {
        return `_x[${idx}]`;
    }
}

module.exports = HookCodeFactory;