import { AppShell } from "@/components/AppShell";
import { SettlementsPage } from "@/components/SettlementsPage";

export default function SettlementsRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <SettlementsPage tripId={params.id} />
    </AppShell>
  );
}
