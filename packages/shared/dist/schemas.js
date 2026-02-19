"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiHealthSchema = void 0;
const zod_1 = require("zod");
exports.apiHealthSchema = zod_1.z.object({
    ok: zod_1.z.boolean(),
    service: zod_1.z.string(),
    time: zod_1.z.string().datetime()
});
//# sourceMappingURL=schemas.js.map