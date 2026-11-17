import { LedgerTable } from "@/components/admin/AdminTables";
import { guardAdminPage } from "@/lib/access";
import { ledgerChecks } from "@/lib/admin-content";

export default async function AdminLedger() {
  await guardAdminPage();
  return <LedgerTable checks={await ledgerChecks()} />;
}
