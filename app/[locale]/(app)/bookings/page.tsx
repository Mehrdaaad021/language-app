import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherBookingsClient from "@/components/bookings/TeacherBookingsClient";

export default async function BookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);
  return <TeacherBookingsClient />;
}