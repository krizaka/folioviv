import { OperationsView } from "@/components/admin/OperationsView";
import { guardAdminPage } from "@/lib/access";
import { operations } from "@/lib/operations";

export const dynamic = "force-dynamic";

/** The database budget, the facts pipeline, live matches that went silent, the seals. */
export default async function AdminOperations() {
  await guardAdminPage();
  return <OperationsView ops={await operations()} />;
}
