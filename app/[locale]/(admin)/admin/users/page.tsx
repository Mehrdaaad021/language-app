import { getAdminUsers } from "@/lib/server/admin-actions";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  return <AdminUsersClient users={users} />;
}