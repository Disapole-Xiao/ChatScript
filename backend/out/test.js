"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log(tokenize(`$name    "你好呀" $joadvbjd $al `));
function tokenize(arg) {
    let tokens = [];
    let start = 0, end = 0, state = 'space';
    while (start < arg.length) {
        switch (state) {
            case 'space':
                if (/\s/.test(arg[end]))
                    start++;
                else if (arg[end] === '"')
                    state = 'string';
                else if (arg[end] === '$')
                    state = 'variable';
                else
                    throw 'speak 语句参数不正确';
                end++;
                break;
            case 'string':
                if (end === arg.length - 1)
                    throw '未关闭的字符串';
                if (arg[end] === '"') {
                    tokens.push({
                        type: 'string',
                        content: arg.slice(start + 1, end),
                    });
                }
                end++;
                start = end;
                state = 'space';
                break;
            case 'variable':
                if (!/\w/.test(arg[end]))
                    throw '变量名只能包含字母、数字和下划线';
                if (arg[end] == ' ') {
                    tokens.push({
                        type: 'variable',
                        content: arg.slice(start + 1, end),
                    });
                    end++;
                    start = end;
                    state = 'space';
                }
                break;
        }
    }
    return tokens;
}
//# sourceMappingURL=test.js.map