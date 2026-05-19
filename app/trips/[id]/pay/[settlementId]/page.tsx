import { AppShell } from "@/components/AppShell";
import { PaymentPage } from "@/components/PaymentPage";

export default function PaymentRoute({
  params,
}: {
  params: { id: string; settlementId: string };
}) {
  return (
    <AppShell tripId={params.id}>
      <PaymentPage tripId={params.id} settlementId={params.settlementId} />
    </AppShell>
  );
}
