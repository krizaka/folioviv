import { UsersTable } from "@/components/admin/AdminTables";
import { guardAdminPage } from "@/lib/access";
import { listUsers } from "@/lib/admin";

export default async function AdminUsers() {
  await guardAdminPage();
  return <UsersTable users={await listUsers()} />;
}
