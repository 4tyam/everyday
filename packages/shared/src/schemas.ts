import { z } from "zod";

export const apiHealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  time: z.string().datetime()
});
