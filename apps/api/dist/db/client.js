"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
let dbInstance = null;
const getDb = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }
    if (dbInstance) {
        return dbInstance;
    }
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    dbInstance = (0, node_postgres_1.drizzle)(pool);
    return dbInstance;
};
exports.getDb = getDb;
//# sourceMappingURL=client.js.map