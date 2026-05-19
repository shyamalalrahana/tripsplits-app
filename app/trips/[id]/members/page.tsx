import { AppShell } from "@/components/AppShell";
import { MembersPage } from "@/components/MembersPage";

export default function MembersRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <MembersPage tripId={params.id} />
    </AppShell>
  );
}
