import { AppShell } from "@/components/AppShell";
import { ExpenseDetailsPage } from "@/components/ExpenseDetailsPage";

export default function ExpenseDetailRoute({
  params,
}: {
  params: { id: string; expenseId: string };
}) {
  return (
    <AppShell tripId={params.id}>
      <ExpenseDetailsPage tripId={params.id} expenseId={params.expenseId} />
    </AppShell>
  );
}
