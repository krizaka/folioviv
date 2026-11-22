// `pnpm --filter @folioviv/db db:drift` — the scheduled job of the folioviv-dev app (krizaka-internal#4233): reads the live schema
// of DATABASE_URL, compares it with schema-expected.json, prints one line, exits 1 on drift (so DigitalOcean's job alert fires).
import { pg, poolConfig } from "./client";
import expected from "./schema-expected.json";
import { readSnapshot, type SchemaSnapshot } from "./schema-check";
import { driftReport } from "./schema-drift";

try {
  const pool = new pg.Pool(poolConfig(process.env.DATABASE_URL ?? "", process.env.DATABASE_CA_CERT, 1));
  const report = driftReport(expected as SchemaSnapshot, await readSnapshot(pool));
  await pool.end();
  console.log(report.line);
  process.exit(report.drifted ? 1 : 0);
} catch (error) {
  console.error(`drift check failed: ${error instanceof Error ? error.message : String(error)}`.slice(0, 600));
  process.exit(1);
}
