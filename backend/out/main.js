"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const parse_1 = require("./parse");
fs.readFile('example1.txt', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const { script, errors } = (0, parse_1.default)(data);
    if (errors) {
        ParseErrorHandler(errors);
        return;
    }
    console.log(script);
});
function ParseErrorHandler(errors) {
}
//# sourceMappingURL=main.js.map