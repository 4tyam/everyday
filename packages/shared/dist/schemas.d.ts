import { z } from "zod";
export declare const apiHealthSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    service: z.ZodString;
    time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    service: string;
    time: string;
}, {
    ok: boolean;
    service: string;
    time: string;
}>;
