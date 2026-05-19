"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { Expense, TripMember, Trip } from "@/lib/types";

const CATEGORIES = ["All", "Food", "Hotel", "Tickets", "Petrol", "Transit", "Drinks", "Shopping", "Parking", "Other"];

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

export function ExpenseListPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

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
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <LoadingCard label="Loading expenses" />;

  const filtered = filter === "All" ? expenses : expenses.filter((e) => e.category === filter);
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const currency = trip?.currency || "INR";

  // Group by date
  const groups: Record<string, Expense[]> = {};
  filtered.forEach((e) => {
    const key = e.expense_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return (
    <>
      <h1>Activity</h1>

      {/* Filter rail */}
      <div className="filterRail">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`filterChip ${filter === c ? "active" : ""}`}
            onClick={() => setFilter(c)}
          >
            {c !== "All" && <span style={{ fontSize: 15 }}>{CATEGORY_EMOJI[c]}</span>}
            {c}
          </button>
        ))}
      </div>

      {/* Summary card */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>
            {filter === "All" ? "All expenses" : `${filter} expenses`}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "-0.02em",
              color: "var(--fg-1)",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(filteredTotal, currency)}
          </div>
        </div>
        <span className="chip info">{filtered.length} entries</span>
      </div>

      {/* Grouped expense list */}
      {Object.entries(groups).length === 0 ? (
        <div className="card emptyState">
          <span style={{ fontSize: 32 }}>🧾</span>
          <p className="muted">No expenses found.</p>
        </div>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="sectionLabel" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {date}
              <span style={{ flex: 1, height: 1, background: "var(--glass)" }} />
              <span style={{ color: "var(--fg-2)", letterSpacing: 0, textTransform: "none", fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(items.reduce((s, e) => s + Number(e.amount), 0), currency)}
              </span>
            </div>
            <div className="grid">
              {items.map((exp) => {
                const payer = members.find((m) => m.id === exp.paid_by_member_id);
                return (
                  <Link key={exp.id} href={`/trips/${tripId}/expenses/${exp.id}`} className="expenseRow">
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: CATEGORY_GRAD[exp.category] || CATEGORY_GRAD.Other,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 22,
                        flexShrink: 0,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px -4px rgba(0,0,0,.4)",
                      }}
                    >
                      {CATEGORY_EMOJI[exp.category] || "🧾"}
                    </div>
                    <div className="expenseRowBody">
                      <div className="expenseRowTitle">{exp.title}</div>
                      <div className="expenseRowSub">
                        {payer?.name || "Unknown"} · {exp.category}
                      </div>
                    </div>
                    <div className="expenseRowRight">
                      <div className="expenseRowAmount">
                        {formatMoney(exp.amount, currency)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
