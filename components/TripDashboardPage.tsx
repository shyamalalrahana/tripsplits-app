"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletCards, Users, ReceiptText, Scale, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingCard } from "@/components/LoadingCard";
import { calculateBalances, formatMoney } from "@/lib/calculations";
import type { Trip, TripMember, Expense, ExpenseSplit } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍽️",
  Petrol: "⛽",
  Hotel: "🏨",
  Tickets: "🎟️",
  Shopping: "🛍️",
  Transit: "🚕",
  Drinks: "🍹",
  Parking: "🅿️",
  Other: "🧾",
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

export function TripDashboardPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [tripRes, membersRes, expensesRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
        supabase.from("expenses").select("*").eq("trip_id", tripId).order("expense_date", { ascending: false }),
      ]);
      setTrip(tripRes.data);
      setMembers(membersRes.data || []);
      setExpenses(expensesRes.data || []);

      if (expensesRes.data && expensesRes.data.length > 0) {
        const expIds = expensesRes.data.map((e: Expense) => e.id);
        const { data: splitsData } = await supabase
          .from("expense_splits")
          .select("*")
          .in("expense_id", expIds);
        setSplits(splitsData || []);
      }

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", authData.user.id)
          .maybeSingle();
        if (prof) {
          const myMember = (membersRes.data || []).find(
            (m: TripMember) => m.profile_id === prof.id
          );
          setMyMemberId(myMember?.id || null);
        }
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <LoadingCard label="Loading trip" />;
  if (!trip) return <div className="card emptyState"><p>Trip not found.</p></div>;

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balances = calculateBalances(members, expenses, splits);
  const myBalance = balances.find((b) => b.member.id === myMemberId);

  // Category breakdown
  const catTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
  });
  const topCats = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const receiveCount = balances.filter((b) => b.balance > 0.01).length;
  const oweCount = balances.filter((b) => b.balance < -0.01).length;

  return (
    <>
      {/* ── Cover Art — exactly matches TripHeroScreen CoverArt ── */}
      <div style={{ position: "relative", borderRadius: 32, overflow: "hidden", marginBottom: 0, isolation: "isolate" }}>
        {/* Aurora gradient background */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1A2240 0%, #2A6CFF 40%, #B57BFF 70%, #FF6BC9 100%)" }}>
          {/* Sun glow */}
          <div style={{ position: "absolute", top: 38, right: 50, width: 64, height: 64, borderRadius: 999, background: "radial-gradient(circle, #FFC55B 0%, #FF8A5B 60%, transparent 75%)", filter: "blur(2px)" }} />
          {/* Mountain silhouettes */}
          <svg viewBox="0 0 360 240" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <path d="M0 165 L60 110 L100 140 L150 80 L210 130 L260 100 L320 145 L360 130 L360 240 L0 240Z" fill="rgba(5,7,13,.45)" />
            <path d="M0 195 L40 165 L90 185 L140 150 L200 180 L250 160 L300 185 L360 170 L360 240 L0 240Z" fill="rgba(5,7,13,.7)" />
            {/* Palm tree */}
            <g transform="translate(40 180)" fill="rgba(5,7,13,.85)">
              <rect x="14" y="0" width="3" height="40" rx="1.5" />
              <path d="M15 6 q-18 -10 -22 -22 q14 -2 24 12 Z" />
              <path d="M16 6 q18 -10 22 -22 q-14 -2 -24 12 Z" />
              <path d="M15 4 q-22 -2 -28 10 q14 8 28 -4 Z" />
            </g>
          </svg>
        </div>
        {/* Fade overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,7,13,.2) 0%, rgba(5,7,13,.4) 50%, rgba(5,7,13,.92) 100%)" }} />
        {/* Content over cover */}
        <div style={{ position: "relative", padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 8, minHeight: 240 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 999,
              background: "var(--glass-strong)", border: "1px solid rgba(255,255,255,.16)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11,
              letterSpacing: ".14em", textTransform: "uppercase", color: "var(--fg-1)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-green)", boxShadow: "0 0 8px #3DE1B1" }} />
              Active
            </span>
            <div style={{ color: "var(--fg-1)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
              {members.length} travellers
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {trip.destination && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>
              📍 {trip.destination}
            </div>
          )}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 0.98, color: "var(--fg-1)", margin: "2px 0 4px" }}>
            {trip.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {members.slice(0, 4).map((m) => (
                <div key={m.id} style={{ width: 28, height: 28, borderRadius: 999, background: m.avatar_color ? `linear-gradient(135deg, ${m.avatar_color}, #B57BFF)` : "linear-gradient(135deg, #5B8CFF, #B57BFF)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#05070D", boxShadow: "0 0 0 2px #0B1020", fontFamily: "var(--font-display)" }}>
                  {(m.name || "?")[0].toUpperCase()}
                </div>
              ))}
            </div>
            <span style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>
              {expenses.length} expenses
            </span>
          </div>
        </div>
      </div>

      {/* Aurora hero balance */}
      <div className="heroAurora">
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "rgba(5,7,13,.6)",
                  marginBottom: 6,
                }}
              >
                {myBalance
                  ? myBalance.balance >= 0
                    ? "You're owed"
                    : "You owe"
                  : "Total spent"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 44,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color: "#05070D",
                }}
              >
                {myBalance
                  ? formatMoney(Math.abs(myBalance.balance), trip.currency)
                  : formatMoney(totalSpent, trip.currency)}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "rgba(5,7,13,.6)",
                }}
              >
                {formatMoney(totalSpent, trip.currency)} total · {expenses.length} expenses
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                color: "rgba(5,7,13,.7)",
              }}
            >
              {members.length} members
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Link
              href={`/trips/${tripId}/settlements`}
              className="btn"
              style={{
                flex: 1,
                padding: "13px 16px",
                borderRadius: 999,
                background: "rgba(5,7,13,.85)",
                color: "var(--fg-1)",
                border: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                justifyContent: "center",
                gap: 8,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.16)",
              }}
            >
              <ReceiptText size={16} strokeWidth={1.6} />
              Settle up
            </Link>
            <Link
              href={`/trips/${tripId}/balances`}
              className="btn"
              style={{
                flex: 1,
                padding: "13px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,.18)",
                color: "#05070D",
                border: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                justifyContent: "center",
                gap: 8,
                backdropFilter: "blur(10px)",
              }}
            >
              <Scale size={16} strokeWidth={1.6} />
              Balances
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="statsGrid">
        <div className="card statCard">
          <div className="statHeader">
            <span className="muted" style={{ fontSize: 12 }}>Total spent</span>
            <span className="statIcon blue"><WalletCards size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="statValue">{formatMoney(totalSpent, trip.currency)}</div>
        </div>
        <div className="card statCard">
          <div className="statHeader">
            <span className="muted" style={{ fontSize: 12 }}>Members</span>
            <span className="statIcon violet"><Users size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="statValue">{members.length}</div>
        </div>
        <div className="card statCard">
          <div className="statHeader">
            <span className="muted" style={{ fontSize: 12 }}>Receive</span>
            <span className="statIcon green"><TrendingUp size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="statValue">{receiveCount}</div>
        </div>
        <div className="card statCard">
          <div className="statHeader">
            <span className="muted" style={{ fontSize: 12 }}>Need to pay</span>
            <span className="statIcon orange"><Scale size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="statValue">{oweCount}</div>
        </div>
      </div>

      {/* Spending by category */}
      {topCats.length > 0 && (
        <div className="card">
          <div className="sectionHead" style={{ marginBottom: 14 }}>
            <div>
              <div className="kicker">Spending</div>
              <h3 style={{ marginTop: 4 }}>By category</h3>
            </div>
          </div>
          {/* Stacked bar */}
          <div className="spendBar">
            {topCats.map(([cat, amt], i) => (
              <div
                key={cat}
                className={`spendBarFill t${i + 1}`}
                style={{ flex: amt }}
              />
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 8,
            }}
          >
            {topCats.map(([cat, amt]) => (
              <div
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-display)",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: CATEGORY_GRAD[cat] || CATEGORY_GRAD.Other,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_EMOJI[cat] || "🧾"}
                </span>
                <span style={{ color: "var(--fg-2)" }}>{cat}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    color: "var(--fg-1)",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatMoney(amt, trip.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="sectionHead">
        <h2>Recent</h2>
        <Link
          href={`/trips/${tripId}/expenses`}
          style={{ color: "var(--accent-blue)", fontSize: 13, fontWeight: 600 }}
        >
          See all →
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="card emptyState">
          <span style={{ fontSize: 32 }}>🧾</span>
          <p className="muted">No expenses yet. Add one!</p>
        </div>
      ) : (
        <div className="grid">
          {expenses.slice(0, 5).map((exp) => {
            const payer = members.find((m) => m.id === exp.paid_by_member_id);
            return (
              <Link key={exp.id} href={`/trips/${tripId}/expenses/${exp.id}`} className="expenseRow">
                <div
                  className={`catTile ${exp.category}`}
                  style={{ width: 44, height: 44, fontSize: 22 }}
                >
                  {CATEGORY_EMOJI[exp.category] || "🧾"}
                </div>
                <div className="expenseRowBody">
                  <div className="expenseRowTitle">{exp.title}</div>
                  <div className="expenseRowSub">
                    {payer?.name || "Unknown"} · {exp.expense_date}
                  </div>
                </div>
                <div className="expenseRowRight">
                  <div className="expenseRowAmount">
                    {formatMoney(exp.amount, trip.currency)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
