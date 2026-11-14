import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getLandingWorkspaces, getLandingForWorkspace } from "@/lib/server/landing-actions";
import AdminLandingEditor from "@/components/admin/AdminLandingEditor";

export default async function AdminLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ws?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const wsId = sp.ws ?? null;

  const [workspaces, initial] = await Promise.all([
    getLandingWorkspaces(),
    getLandingForWorkspace(wsId),
  ]);

  return <AdminLandingEditor workspaces={workspaces} initial={initial} />;
}