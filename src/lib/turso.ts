import { createClient, Client } from "@libsql/client";

let tursoClient: Client | null = null;

export function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  const url = process.env.TURSO_DATABASE_URL || "file:nexus_erp.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  tursoClient = createClient({
    url,
    authToken,
  });

  return tursoClient;
}

export const turso = getTursoClient();
