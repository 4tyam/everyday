"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const shared_1 = require("shared");
const healthRouter = (0, express_1.Router)();
exports.healthRouter = healthRouter;
healthRouter.get("/", (_req, res) => {
    const payload = {
        ok: true,
        service: shared_1.SERVICE_NAME,
        time: new Date().toISOString()
    };
    res.json(shared_1.apiHealthSchema.parse(payload));
});
//# sourceMappingURL=health.js.map