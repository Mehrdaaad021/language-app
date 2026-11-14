// growth/page.tsx
import { getGrowthData } from "@/lib/server/admin-actions";
import AdminChart from "@/components/admin/AdminChart";

export default async function AdminGrowthPage() {
  const data = await getGrowthData();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">نمودار رشد</h1>
      <div className="card-lux p-6">
        <AdminChart data={data} />
      </div>
    </div>
  );
}