import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { factory } from "./factory.ts";
import { clerk } from "./middlewares/clerk.ts";
import { route as chatRoute } from "./routes/chat.ts";
import { route as exampleRoute } from "./routes/example.ts";
import { scoreRoute } from "./routes/score.ts";
import { route as vesselsRoute } from "./routes/vessels.ts";
const app = factory.createApp();

// Add CORS middleware for local development
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      // Allow requests from Vite dev server or same origin
      if (
        !origin ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://localhost")
      ) {
        return origin;
      }
      return "http://127.0.0.1:5173";
    },
    credentials: true,
  }),
);

// Add Clerk authentication middleware to all API routes
app.use("/api/*", clerk);

app.get("/healthz", (c) => {
  return c.json({ message: "Ok" });
});

export const apiRoutes = app
  .basePath("/api")
  .route("/example", exampleRoute)
  .route("/vessels", vesselsRoute)
  .route("/score", scoreRoute)
  .route("/chat", chatRoute);

export type ApiRoutes = typeof apiRoutes;

app
  .get("/*", serveStatic({ root: "./dist/static" }))
  .get("/*", serveStatic({ path: "./dist/static/index.html" }));

// eslint-disable-next-line @typescript-eslint/require-await
(async () => {
  const port = 3000;
  serve({ fetch: app.fetch, port }, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${port.toString()}`);
  });
})().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
