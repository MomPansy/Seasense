import { hc } from "hono/client";
import { type ApiRoutes } from "server/index.ts";

export const { api } = hc<ApiRoutes>(window.location.origin);
