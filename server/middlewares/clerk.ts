import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { createMiddleware } from "hono/factory";
import type { Variables } from "../factory";

// Clerk middleware - validates tokens but doesn't require auth
export const clerk = clerkMiddleware();

// Middleware to require authentication
export const requireAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json(
        {
          error: "Unauthorized",
          message: "You must be signed in to access this resource",
        },
        401,
      );
    }

    await next();
  },
);
