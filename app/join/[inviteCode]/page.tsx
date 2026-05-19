import { AppShell } from "@/components/AppShell";
import { JoinTripPage } from "@/components/JoinTripPage";

export default function JoinRoute({ params }: { params: { inviteCode: string } }) {
  return (
    <AppShell>
      <JoinTripPage inviteCode={params.inviteCode} />
    </AppShell>
  );
}
