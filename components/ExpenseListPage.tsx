"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { Expense, TripMember, Trip } from "@/lib/types";

const CATS = [
  { name: "All",      icon: "✨", grad: "linear-gradient(135deg,#5B8CFF,#B57BFF)" },
  { name: "Food",     icon: "🍽️", grad: "linear-gradient(135deg,#FF8A5B,#FF6BC9)" },
  { name: "Petrol",   icon: "⛽", grad: "linear-gradient(135deg,#FFC55B,#FF8A5B)" },
  { name: "Hotel",    icon: "🏨", grad: "linear-gradient(135deg,#5B8CFF,#B57BFF)" },
  { name: "Tickets",  icon: "🎟️", grad: "linear-gradient(135deg,#B57BFF,#FF6BC9)" },
  { name: "Shopping", icon: "🛍️", grad: "linear-gradient(135deg,#FF6BC9,#B57BFF)" },
  { name: "Transit",  icon: "🚕", grad: "linear-gradient(135deg,#2A6CFF,#3DE1B1)" },
  { name: "Drinks",   icon: "🍹", grad: "linear-gradient(135deg,#FF6BC9,#FFC55B)" },
  { name: "Parking",  icon: "🅿️", grad: "linear-gradient(135deg,#5B8CFF,#2A6CFF)" },
  { name: "Other",    icon: "🧾", grad: "linear-gradient(135deg,#6A7497,#A6B0D4)" },
];

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

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍽️", Petrol: "⛽", Hotel: "🏨", Tickets: "🎟️",
  Shopping: "🛍️", Transit: "🚕", Drinks: "🍹", Parking: "🅿️", Other: "🧾",
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
      {/* Filter chip rail — matches ActivityScreen */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
        }}
      >
        {CATS.map((c) => {
          const active = filter === c.name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => setFilter(c.name)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flex: "0 0 auto",
                padding: "8px 14px 8px 8px",
                borderRadius: 999,
                background: active
                  ? "linear-gradient(180deg, rgba(91,140,255,.22), rgba(91,140,255,.08))"
                  : "rgba(255,255,255,.04)",
                border: `1px solid ${active ? "rgba(91,140,255,.4)" : "var(--line)"}`,
                color: active ? "var(--fg-1)" : "var(--fg-2)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  background: c.grad,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </span>
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Total summary card */}
      <div
        className="card"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}
      >
        <div>
          <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>
            {filter === "All" ? "Every category" : `${filter} expenses`}
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
          <div key={date} style={{ marginBottom: 18 }}>
            {/* Date group header */}
            <div className="dateGroup">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 9h18M8 3v4M16 3v4" />
              </svg>
              {date}
              <span className="dateGroupLine" />
              <span className="dateGroupTotal">
                {formatMoney(items.reduce((s, e) => s + Number(e.amount), 0), currency)}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((exp) => {
                const payer = members.find((m) => m.id === exp.paid_by_member_id);
                return (
                  <Link key={exp.id} href={`/trips/${tripId}/expenses/${exp.id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
                        border: "1px solid rgba(255,255,255,.08)",
                        borderRadius: 20,
                        padding: 14,
                        backdropFilter: "blur(24px) saturate(140%)",
                        WebkitBackdropFilter: "blur(24px) saturate(140%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      {/* Category tile 46×46 */}
                      <div
                        style={{
                          width: 46,
                          height: 46,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: 15,
                            color: "var(--fg-1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {exp.title}
                        </div>
                        <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500, marginTop: 3 }}>
                          {payer?.name || "Unknown"} · {exp.expense_date}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "var(--fg-1)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatMoney(exp.amount, currency)}
                        </div>
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
