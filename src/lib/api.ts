import { hc } from "hono/client";
import { type ApiRoutes } from "server/index";

export const { api } = hc<ApiRoutes>(window.location.origin);
