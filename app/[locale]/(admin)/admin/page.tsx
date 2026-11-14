import { getAdminDashboard, getGrowthData } from "@/lib/server/admin-actions";
import { Users, School, GraduationCap, Wallet, Ticket, AlertTriangle, TrendingUp } from "lucide-react";
import AdminChartV2 from "@/components/admin/AdminChartV2";

export default async function AdminDashboardPage() {
  const [stats, growth] = await Promise.all([getAdminDashboard(), getGrowthData()]);

  const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  const cards = [
    { icon: Users, label: "کاربران کل", value: fmt(stats.totalUsers), tint: "from-[#f8d8e0] to-[#fce8ed]" },
    { icon: School, label: "معلم‌ها", value: fmt(stats.totalTeachers), tint: "from-[#f6e7c6] to-[#fbf0d9]" },
    { icon: GraduationCap, label: "شاگردها", value: fmt(stats.totalStudents), tint: "from-[#e0f0e6] to-[#eaf7ee]" },
    { icon: Wallet, label: "درآمد کل (تومان)", value: toFa(fmt(stats.totalRevenue)), tint: "from-[#e5dff2] to-[#efebf9]" },
    { icon: TrendingUp, label: "جلسات ثبت‌شده", value: fmt(stats.totalSessions), tint: "from-[#f6e7c6] to-[#fbf0d9]" },
    { icon: Ticket, label: "تیکت‌های باز", value: fmt(stats.openTickets), tint: "from-[#f6d2ce] to-[#fbe3e1]" },
    { icon: AlertTriangle, label: "کاربران معلق", value: fmt(stats.suspendedUsers), tint: "from-[#f6d2ce] to-[#fbe3e1]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">داشبورد ادمین</h1>
        <p className="mt-1 text-sm text-[var(--c-ink-soft)]">نمای کلی از وضعیت پلتفرم</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`card-lux bg-gradient-to-br ${c.tint} p-5`}>
              <div className="flex items-start justify-between">
                <Icon size={22} className="text-[#4a2430]" />
              </div>
              <p className="mt-3 text-3xl font-extrabold tabular-nums text-[#40222c]">{c.value}</p>
              <p className="mt-1 text-xs font-bold text-[#7c5a63]">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card-lux p-6">
        <h2 className="mb-4 text-base font-extrabold">رشد ۳۰ روز اخیر</h2>
        <AdminChartV2 data={growth} />
      </div>
    </div>
  );
}