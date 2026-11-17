import { AuditTable } from "@/components/admin/AdminTables";
import { guardAdminPage } from "@/lib/access";
import { auditLog } from "@/lib/admin";

export default async function AdminAudit() {
  await guardAdminPage();
  return <AuditTable entries={await auditLog(500)} />;
}
