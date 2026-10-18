import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import TwoFactorSettings from "@/components/settings/TwoFactorSettings";
import PageHeader from "@/components/ui/PageHeader";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect(`/${locale}/login`);

  const t = await getTranslations({ locale, namespace: "Settings" });

  return (
    <Stagger>
      <StaggerItem>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
      </StaggerItem>
      <StaggerItem>
        <TwoFactorSettings />
      </StaggerItem>
    </Stagger>
  );
}