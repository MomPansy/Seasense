import { appEnvVariables } from "server/env.ts";
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon, neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
import ws from 'ws';

let connectionString = appEnvVariables.DB_URL;

// Use pg for development, neon-http for production
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuring Neon for local development
if (isDevelopment) {
  // Configure neonConfig for local proxy
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  };
  
  const connectionStringUrl = new URL(connectionString);
  neonConfig.useSecureWebSocket = connectionStringUrl.hostname !== 'db.localtest.me';
  neonConfig.wsProxy = (host) => (host === 'db.localtest.me' ? `${host}:4444/v2` : `${host}/v2`);
}

neonConfig.webSocketConstructor = ws;

export const db = isDevelopment
  ? drizzlePg(new pg.Pool({ connectionString }))
  : drizzleNeon({ client: neon(connectionString) });