import { type PgTransactionConfig } from "drizzle-orm/pg-core";
import { type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import postgres from "postgres";
import { type Tx, db } from "server/lib/db.ts";

export interface TxVariables {
  tx: Tx;
}

interface Options {
  txConfig?: PgTransactionConfig;
}

export function drizzle(
  options: Options = {},
): MiddlewareHandler<{ Variables: TxVariables }> {
  return createMiddleware<{ Variables: TxVariables }>(async (c, next) => {
    try {
      await db.transaction(async (tx) => {
        c.set("tx", tx);
        await next();
      }, options.txConfig);
    } catch (error) {
      if (error instanceof postgres.PostgresError) {
        if (error.code === "P0001") {
          throw new HTTPException(401, {
            res: Response.json({ error: "unauthorized" }, { status: 401 }),
          });
        }
        if (error.code === "42501") {
          throw new HTTPException(403, {
            res: Response.json({ error: "forbidden" }, { status: 403 }),
          });
        }
      }
      throw error;
    }
  });
}
