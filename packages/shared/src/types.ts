import type { z } from "zod";
import type { apiHealthSchema } from "./schemas";

export type ApiHealth = z.infer<typeof apiHealthSchema>;
