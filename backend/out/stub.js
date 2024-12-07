"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
stub: Stub = {
    parseErrorHandler(errors) {
        for (let error of errors) {
            console.error(error);
        }
    },
    runtimeErrorHandler(error) {
        console.error(error);
    },
    userInput() {
        process.stdin.
        ;
    },
};
//# sourceMappingURL=stub.js.map