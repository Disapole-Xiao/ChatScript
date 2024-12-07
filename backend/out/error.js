"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeError = exports.ParseError = void 0;
class ParseError {
    constructor(line, message) {
        this.name = 'ParseError';
        this.line = line;
        this.message = message;
    }
    toString() {
        return `${this.name}: ${this.message} at line ${this.line}`;
    }
    toJSON() {
        return {
            name: this.name,
            line: this.line,
            message: this.message,
        };
    }
}
exports.ParseError = ParseError;
class RuntimeError {
    constructor(line, message) {
        this.name = 'RuntimeError';
        this.line = line;
        this.message = message;
    }
    toString() {
        return `${this.name}: ${this.message} at line ${this.line}`;
    }
}
exports.RuntimeError = RuntimeError;
//# sourceMappingURL=error.js.map