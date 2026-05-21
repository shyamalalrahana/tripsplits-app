"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
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

function FakeQR() {
  const cells: boolean[] = [];
  for (let i = 0; i < 144; i++) cells.push(((i * 1103515245 + 12345) >> 8) % 7 < 3);
  const isFinder = (x: number, y: number) => (x < 3 && y < 3) || (x > 8 && y < 3) || (x < 3 && y > 8);
  return (
    <svg viewBox="0 0 12 12" width="94" height="94">
      {cells.map((on, i) => {
        const x = i % 12, y = Math.floor(i / 12);
        if (isFinder(x, y)) return null;
        return on ? <rect key={i} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" fill="#05070D" rx="0.15" /> : null;
      })}
      {([[0, 0], [9, 0], [0, 9]] as [number, number][]).map(([x, y]) => (
        <g key={`${x},${y}`}>
          <rect x={x} y={y} width="3" height="3" fill="#05070D" rx="0.5" />
          <rect x={x + 0.5} y={y + 0.5} width="2" height="2" fill="white" rx="0.3" />
          <rect x={x + 1} y={y + 1} width="1" height="1" fill="#05070D" rx="0.15" />
        </g>
      ))}
    </svg>
  );
}

export function SettlementsPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [settlements, setSettlements] = useState<MergedSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      {/* Hero glass card */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(91,140,255,.18), rgba(181,123,255,.12) 60%, rgba(255,107,201,.10))",
          border: "1px solid rgba(91,140,255,.22)",
          borderRadius: 28,
          padding: 20,
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--accent-blue)",
          }}
        >
          Smart payment plan
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            marginTop: 6,
            lineHeight: 1.05,
          }}
        >
          {totalCount === 0
            ? "Everyone is settled!"
            : `${totalCount} payment${totalCount !== 1 ? "s" : ""}, and everyone's square`}
        </div>
        <div
          style={{
            color: "var(--fg-2)",
            fontSize: 13,
            fontWeight: 500,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Scan to pay with any UPI app. Confirmation is manual for now.
        </div>

        {/* Stat counters */}
        <div className="settleStatRow">
          {[
            { n: totalCount, l: "Total", color: "var(--fg-1)" },
            { n: settledCount, l: "Settled", color: "var(--accent-green)" },
            { n: waitingCount, l: "Waiting", color: "var(--accent-yellow)" },
            { n: pendingCount, l: "To pay", color: "var(--accent-orange)" },
          ].map(({ n, l, color }) => (
            <div key={l} className="settleStat">
              <div className="settleStatNum" style={{ color }}>{n}</div>
              <div className="settleStatLabel">{l}</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                : "Open";
            const isExpanded = expandedId === i;

            return (
              <div
                key={i}
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 22,
                  overflow: "hidden",
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
                }}
              >
                {/* Collapsed header — always visible */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : i)}
                  style={{ padding: "16px 18px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Overlapping avatars */}
                    <div className="avatarPair">
                      <AvatarView name={from?.name || "?"} color={from?.avatar_color} size={36} />
                      <AvatarView name={to?.name || "?"} color={to?.avatar_color} size={36} />
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
                        {from?.name || "?"}{" "}
                        <ArrowRight size={14} strokeWidth={1.6} />{" "}
                        {to?.name || "?"}
                      </div>
                      <div style={{ color: "var(--fg-2)", fontSize: 11.5, fontWeight: 500, marginTop: 2 }}>
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
                </div>

                {/* Expanded QR panel */}
                {isExpanded && (
                  <div className="settlePayPanel">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {/* Fake QR box */}
                      <div
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: 16,
                          padding: 8,
                          background: "white",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FakeQR />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: ".18em",
                            textTransform: "uppercase",
                            color: "var(--fg-3)",
                          }}
                        >
                          Pay to
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 18,
                            color: "var(--fg-1)",
                            marginTop: 2,
                          }}
                        >
                          {to?.name || "?"}
                        </div>
                        {to?.upi_id && (
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              color: "var(--fg-2)",
                              marginTop: 6,
                              wordBreak: "break-all",
                            }}
                          >
                            {to.upi_id}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                          <span className="chip info" style={{ fontSize: 11, padding: "4px 9px" }}>UPI QR</span>
                          <span className="chip" style={{ fontSize: 11, padding: "4px 9px" }}>GPay · PhonePe</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      {/* Pay now aurora button */}
                      <button
                        className="btn btnPrimary"
                        style={{ flex: 1 }}
                        onClick={() => markPaid(s)}
                        type="button"
                      >
                        Pay now
                      </button>
                      {/* Paid ghost button */}
                      {s.status === "paid_by_sender" && (
                        <button
                          className="btn btnGlass"
                          onClick={() => confirmReceived(s)}
                          type="button"
                        >
                          Confirm received
                        </button>
                      )}
                      {s.status !== "paid_by_sender" && (
                        <button
                          className="btn btnGlass"
                          onClick={() => markPaid(s)}
                          type="button"
                        >
                          Paid
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
