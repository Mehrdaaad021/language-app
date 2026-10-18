import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadStudentArea } from "@/lib/server/queries";
import Notebook from "@/components/ui/Notebook";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";

export default async function StudentNotebookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect(`/${locale}/login`);

  const bundle = await loadStudentArea(session.sub);
  if (!bundle) return null;

  return (
    <Stagger>
      <StaggerItem>
        <Notebook notes={bundle.notes} />
      </StaggerItem>
    </Stagger>
  );
}