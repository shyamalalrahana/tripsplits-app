"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import {
  calculateBalances,
  calculateSettlementDrafts,
  mergeSettlementStatus,
  formatMoney,
} from "@/lib/calculations";
import type { TripMember, Expense, ExpenseSplit, Settlement, Trip } from "@/lib/types";

type MergedSettlement = {
  from_member_id: string;
  to_member_id: string;
  amount: number;
  payment_note: string;
  id?: string;
  status: string;
  paid_at: string | null;
  confirmed_at: string | null;
};

export function SettlementsPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [settlements, setSettlements] = useState<MergedSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [tripRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase.from("trip_members").select("*").eq("trip_id", tripId),
      supabase.from("expenses").select("*").eq("trip_id", tripId),
      supabase.from("settlements").select("*").eq("trip_id", tripId),
    ]);
    const expenses: Expense[] = expensesRes.data || [];
    const mems: TripMember[] = membersRes.data || [];
    const existing: Settlement[] = settlementsRes.data || [];
    setTrip(tripRes.data);
    setMembers(mems);

    let splits: ExpenseSplit[] = [];
    if (expenses.length > 0) {
      const { data: splitsData } = await supabase
        .from("expense_splits")
        .select("*")
        .in("expense_id", expenses.map((e) => e.id));
      splits = splitsData || [];
    }

    const balances = calculateBalances(mems, expenses, splits);
    const drafts = calculateSettlementDrafts(balances, tripRes.data?.name || "");
    setSettlements(mergeSettlementStatus(drafts, existing) as MergedSettlement[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [tripId]);

  async function markPaid(settlement: MergedSettlement) {
    if (settlement.id) {
      await supabase
        .from("settlements")
        .update({ status: "paid_by_sender", paid_at: new Date().toISOString() })
        .eq("id", settlement.id);
    } else {
      await supabase.from("settlements").insert({
        trip_id: tripId,
        from_member_id: settlement.from_member_id,
        to_member_id: settlement.to_member_id,
        amount: settlement.amount,
        payment_note: settlement.payment_note,
        status: "paid_by_sender",
        paid_at: new Date().toISOString(),
      });
    }
    await loadAll();
  }

  async function confirmReceived(settlement: MergedSettlement) {
    if (settlement.id) {
      await supabase
        .from("settlements")
        .update({ status: "confirmed_by_receiver", confirmed_at: new Date().toISOString() })
        .eq("id", settlement.id);
      await loadAll();
    }
  }

  if (loading) return <LoadingCard label="Loading settlements" />;

  const currency = trip?.currency || "INR";
  const totalCount = settlements.length;
  const settledCount = settlements.filter((s) => s.status === "confirmed_by_receiver").length;
  const waitingCount = settlements.filter((s) => s.status === "paid_by_sender").length;
  const pendingCount = settlements.filter((s) => s.status === "pending").length;

  return (
    <>
      <h1>Settle up</h1>

      {/* Hero summary */}
      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, rgba(91,140,255,.18), rgba(181,123,255,.12) 60%, rgba(255,107,201,.10))",
          borderColor: "rgba(91,140,255,.22)",
        }}
      >
        <div className="kicker" style={{ color: "var(--accent-blue)", marginBottom: 6 }}>
          Smart payment plan
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            lineHeight: 1.1,
          }}
        >
          {totalCount === 0
            ? "Everyone is settled!"
            : `${totalCount} payment${totalCount !== 1 ? "s" : ""}, and everyone's square`}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          {[
            { n: totalCount, l: "Total", tone: "fg-1" },
            { n: settledCount, l: "Settled", color: "var(--accent-green)" },
            { n: waitingCount, l: "Waiting", color: "var(--accent-yellow)" },
            { n: pendingCount, l: "To pay", color: "var(--accent-orange)" },
          ].map(({ n, l, color }) => (
            <div key={l} style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 22,
                  color: color || "var(--fg-1)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {n}
              </div>
              <div
                style={{
                  color: "var(--fg-3)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  marginTop: 4,
                  fontFamily: "var(--font-display)",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement cards */}
      {settlements.length === 0 ? (
        <div className="card emptyState">
          <span style={{ fontSize: 40 }}>✅</span>
          <h3>All settled!</h3>
          <p className="muted">No payments needed.</p>
        </div>
      ) : (
        <div className="grid">
          {settlements.map((s, i) => {
            const from = members.find((m) => m.id === s.from_member_id);
            const to = members.find((m) => m.id === s.to_member_id);
            const tone =
              s.status === "confirmed_by_receiver"
                ? "positive"
                : s.status === "paid_by_sender"
                ? "pending"
                : "neutral";
            const statusLabel =
              s.status === "confirmed_by_receiver"
                ? "Settled"
                : s.status === "paid_by_sender"
                ? "Waiting"
                : "Pending";

            return (
              <div key={i} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ position: "relative", display: "flex" }}>
                    <AvatarView name={from?.name || "?"} color={from?.avatar_color} size={36} />
                    <div style={{ marginLeft: -10, zIndex: 2 }}>
                      <AvatarView name={to?.name || "?"} color={to?.avatar_color} size={36} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--fg-1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {from?.name || "?"} <ArrowRight size={14} strokeWidth={1.6} /> {to?.name || "?"}
                    </div>
                    <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500, marginTop: 2 }}>
                      {to?.name || "?"} should receive
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 18,
                        color: "var(--fg-1)",
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {formatMoney(s.amount, currency)}
                    </div>
                    <span className={`chip ${tone}`} style={{ marginTop: 4, fontSize: 10, padding: "3px 8px" }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* UPI / actions */}
                {to?.upi_id && (
                  <div
                    style={{
                      padding: "12px 0 0",
                      borderTop: "1px solid var(--line)",
                      marginBottom: 12,
                    }}
                  >
                    <div className="kicker" style={{ marginBottom: 4 }}>Pay to UPI</div>
                    <div className="mono" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                      {to.upi_id}
                    </div>
                  </div>
                )}

                <div className="settleActions">
                  {s.status === "pending" && (
                    <>
                      {s.id && (
                        <Link
                          href={`/trips/${tripId}/pay/${s.id}`}
                          className="btn btnPrimary"
                          style={{ fontSize: 13, padding: "10px 18px" }}
                        >
                          <CreditCard size={15} />
                          Pay {formatMoney(s.amount, currency)}
                        </Link>
                      )}
                      <button
                        className="btn btnGlass"
                        style={{ fontSize: 13, padding: "10px 18px" }}
                        onClick={() => markPaid(s)}
                        type="button"
                      >
                        <Check size={15} />
                        Mark Paid
                      </button>
                    </>
                  )}
                  {s.status === "paid_by_sender" && (
                    <button
                      className="btn btnPrimary"
                      style={{ fontSize: 13, padding: "10px 18px" }}
                      onClick={() => confirmReceived(s)}
                      type="button"
                    >
                      <Check size={15} />
                      Confirm Received
                    </button>
                  )}
                  {s.status === "confirmed_by_receiver" && (
                    <span className="chip positive">Settled ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
