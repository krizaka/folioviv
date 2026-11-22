import { diffSnapshot, type SchemaSnapshot } from "./schema-check";

// @fixed: the schemas the application owns on the dev cluster; the others (drizzle's bookkeeping, the platform's) are not ours to judge
export const WATCHED_SCHEMAS = ["organize", "privacy", "public"] as const;

export interface DriftReport {
  drifted: boolean;
  /** One line: « no drift », or « drift: » and the problems, `; `-separated. */
  line: string;
}

function watchedOnly(snapshot: SchemaSnapshot): SchemaSnapshot {
  const tables = Object.fromEntries(
    Object.entries(snapshot.tables).filter(([table]) =>
      (WATCHED_SCHEMAS as readonly string[]).includes(table.split(".")[0] ?? ""),
    ),
  );
  return { ...snapshot, tables };
}

/** The live schema against the expected snapshot, for the three watched schemas: one line and whether it drifted. */
export function driftReport(expected: SchemaSnapshot, actual: SchemaSnapshot): DriftReport {
  const problems = diffSnapshot(watchedOnly(expected), watchedOnly(actual));
  if (problems.length === 0) {
    return { drifted: false, line: "no drift" };
  }
  return { drifted: true, line: `drift: ${problems.join("; ")}` };
}
