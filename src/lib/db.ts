import { neon } from "@neondatabase/serverless";

let cachedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL!);
  }
  return cachedSql;
}

type QueryTag = <T = Array<Record<string, unknown>>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T>;

export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => getSql()(strings, ...values)) as QueryTag;
