import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { getDb } from "./db/client.js";
import * as authSchema from "./db/auth-schema.js";

const appScheme = process.env.APP_SCHEME ?? "everyday";

const trustedOrigins = [
	`${appScheme}://`,
	"exp://",
	"http://localhost:8081",
	"http://127.0.0.1:8081",
	...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
		? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
				.map((origin) => origin.trim())
				.filter(Boolean)
		: []),
];

if (!process.env.BETTER_AUTH_SECRET) {
	throw new Error("BETTER_AUTH_SECRET is not set");
}
if (!process.env.BETTER_AUTH_URL) {
	throw new Error("BETTER_AUTH_URL is not set");
}
export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins,
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		schema: authSchema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "email-password"],
		},
	},
	socialProviders:
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
						prompt: "select_account",
					},
				}
			: undefined,
	plugins: [expo()],
});
