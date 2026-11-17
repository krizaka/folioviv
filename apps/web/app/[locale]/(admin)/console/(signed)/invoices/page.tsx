import { InvoicesTable } from "@/components/admin/AdminTables";
import { guardAdminPage } from "@/lib/access";
import { invoicesOverview } from "@/lib/admin-content";

export default async function AdminInvoices() {
  await guardAdminPage();
  return <InvoicesTable invoices={await invoicesOverview()} />;
}
