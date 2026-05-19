"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Calendar, StickyNote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { Expense, ExpenseSplit, TripMember, Trip } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍽️", Petrol: "⛽", Hotel: "🏨", Tickets: "🎟️",
  Shopping: "🛍️", Transit: "🚕", Drinks: "🍹", Parking: "🅿️", Other: "🧾",
};

const CATEGORY_GRAD: Record<string, string> = {
  Food: "linear-gradient(135deg,#FF8A5B,#FF6BC9)",
  Petrol: "linear-gradient(135deg,#FFC55B,#FF8A5B)",
  Hotel: "linear-gradient(135deg,#5B8CFF,#B57BFF)",
  Tickets: "linear-gradient(135deg,#B57BFF,#FF6BC9)",
  Shopping: "linear-gradient(135deg,#FF6BC9,#B57BFF)",
  Transit: "linear-gradient(135deg,#2A6CFF,#3DE1B1)",
  Drinks: "linear-gradient(135deg,#FF6BC9,#FFC55B)",
  Parking: "linear-gradient(135deg,#5B8CFF,#2A6CFF)",
  Other: "linear-gradient(135deg,#6A7497,#A6B0D4)",
};

export function ExpenseDetailsPage({ tripId, expenseId }: { tripId: string; expenseId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [tripRes, expRes, membersRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("expenses").select("*").eq("id", expenseId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
      ]);
      setTrip(tripRes.data);
      setExpense(expRes.data);
      setMembers(membersRes.data || []);

      const { data: splitsData } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("expense_id", expenseId);
      setSplits(splitsData || []);
      setLoading(false);
    }
    load();
  }, [tripId, expenseId]);

  async function deleteExpense() {
    if (!confirm("Delete this expense?")) return;
    await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
    await supabase.from("expenses").delete().eq("id", expenseId);
    router.push(`/trips/${tripId}/expenses`);
  }

  if (loading) return <LoadingCard label="Loading expense" />;
  if (!expense) return <div className="card emptyState"><p>Expense not found.</p></div>;

  const currency = trip?.currency || "INR";
  const payer = members.find((m) => m.id === expense.paid_by_member_id);

  return (
    <>
      {/* Category hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px",
          borderRadius: 28,
          background: CATEGORY_GRAD[expense.category] || CATEGORY_GRAD.Other,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.35)",
        }}
      >
        <div style={{ fontSize: 52 }}>{CATEGORY_EMOJI[expense.category] || "🧾"}</div>
        <div>
          <div className="kicker" style={{ color: "rgba(5,7,13,.6)", marginBottom: 4 }}>
            {expense.category}
          </div>
          <h2 style={{ color: "#05070D", fontSize: 22 }}>{expense.title}</h2>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 32,
              color: "#05070D",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {formatMoney(expense.amount, currency)}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {payer && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AvatarView name={payer.name} color={payer.avatar_color} size={40} />
              <div>
                <div className="kicker">Paid by</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--fg-1)",
                  }}
                >
                  {payer.name}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-2)" }}>
            <Calendar size={16} strokeWidth={1.6} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>
              {expense.expense_date}
            </span>
          </div>
          {expense.notes && (
            <div style={{ display: "flex", gap: 10, color: "var(--fg-2)" }}>
              <StickyNote size={16} strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{expense.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Split breakdown */}
      {splits.length > 0 && (
        <>
          <h2>Split breakdown</h2>
          <div className="grid">
            {splits.map((split) => {
              const member = members.find((m) => m.id === split.member_id);
              return (
                <div
                  key={split.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 18,
                    background: "var(--glass)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <AvatarView
                    name={member?.name || "?"}
                    color={member?.avatar_color}
                    size={38}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--fg-1)",
                      }}
                    >
                      {member?.name || "Unknown"}
                    </div>
                    <div style={{ color: "var(--fg-3)", fontSize: 12 }}>
                      {split.split_type} split
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--fg-1)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(split.split_amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button
        className="btn btnDanger"
        style={{ width: "100%" }}
        onClick={deleteExpense}
        type="button"
      >
        <Trash2 size={16} />
        Delete expense
      </button>
    </>
  );
}
