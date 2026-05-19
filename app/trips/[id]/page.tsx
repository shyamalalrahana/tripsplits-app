import { AppShell } from "@/components/AppShell";
import { TripDashboardPage } from "@/components/TripDashboardPage";

export default function TripRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <TripDashboardPage tripId={params.id} />
    </AppShell>
  );
}
