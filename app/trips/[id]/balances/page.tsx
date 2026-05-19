import { AppShell } from "@/components/AppShell";
import { BalancesPage } from "@/components/BalancesPage";

export default function BalancesRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <BalancesPage tripId={params.id} />
    </AppShell>
  );
}
