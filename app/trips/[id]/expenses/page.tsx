import { AppShell } from "@/components/AppShell";
import { ExpenseListPage } from "@/components/ExpenseListPage";

export default function ExpenseListRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <ExpenseListPage tripId={params.id} />
    </AppShell>
  );
}
