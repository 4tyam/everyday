import { Router } from "express";
import { apiHealthSchema, SERVICE_NAME, type ApiHealth } from "shared";

const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  const payload: ApiHealth = {
    ok: true,
    service: SERVICE_NAME,
    time: new Date().toISOString()
  };

  res.json(apiHealthSchema.parse(payload));
});

export { healthRouter };
