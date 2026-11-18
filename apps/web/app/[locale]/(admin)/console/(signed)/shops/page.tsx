import { ShopsTable } from "@/components/admin/AdminTables";
import { guardAdminPage } from "@/lib/access";
import { shopsOverview } from "@/lib/admin-content";

export default async function AdminShops() {
  await guardAdminPage();
  return <ShopsTable shops={await shopsOverview()} />;
}
