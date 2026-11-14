import { getAdminTeachers } from "@/lib/server/admin-actions";
import AdminTeachersClient from "@/components/admin/AdminTeachersClient";

export default async function AdminTeachersPage() {
  const teachers = await getAdminTeachers();
  return <AdminTeachersClient teachers={teachers} />;
}