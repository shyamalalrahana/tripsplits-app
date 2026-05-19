import { AppShell } from "@/components/AppShell";
import { AddExpensePage } from "@/components/AddExpensePage";

export default function AddExpenseRoute({ params }: { params: { id: string } }) {
  return (
    <AppShell tripId={params.id}>
      <AddExpensePage tripId={params.id} />
    </AppShell>
  );
}
