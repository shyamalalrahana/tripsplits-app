"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { calculateBalances, formatMoney, type MemberBalance } from "@/lib/calculations";
import type { TripMember, Expense, ExpenseSplit, Trip } from "@/lib/types";

export function BalancesPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [tripRes, membersRes, expensesRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
        supabase.from("expenses").select("*").eq("trip_id", tripId),
      ]);
      const expenses: Expense[] = expensesRes.data || [];
      const mems: TripMember[] = membersRes.data || [];
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

      setBalances(calculateBalances(mems, expenses, splits));

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", authData.user.id)
          .maybeSingle();
        if (prof) {
          const myM = mems.find((m) => m.profile_id === prof.id);
          setMyMemberId(myM?.id || null);
        }
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) return <LoadingCard label="Loading balances" />;

  const sorted = [...balances].sort((a, b) => b.balance - a.balance);
  const myBalance = balances.find((b) => b.member.id === myMemberId);
  const currency = trip?.currency || "INR";

  return (
    <>
      <h1>Balances</h1>

      {/* My standing hero */}
      {myBalance && (
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, rgba(61,225,177,.18), rgba(91,140,255,.10))",
            borderColor: "rgba(61,225,177,.22)",
          }}
        >
          <div className="kicker" style={{ color: "var(--accent-green)", marginBottom: 8 }}>
            Your standing
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>
                {myBalance.balance >= 0 ? "You're owed" : "You owe"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 40,
                  letterSpacing: "-0.03em",
                  color: myBalance.balance >= 0 ? "var(--accent-green)" : "var(--accent-orange)",
                  lineHeight: 1,
                  marginTop: 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(Math.abs(myBalance.balance), currency)}
              </div>
            </div>
            <AvatarView name={myBalance.member.name} color={myBalance.member.avatar_color} size={56} />
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--fg-2)", fontSize: 11, fontWeight: 500 }}>You paid</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--fg-1)",
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 2,
                }}
              >
                {formatMoney(myBalance.paid, currency)}
              </div>
            </div>
            <div style={{ width: 1, background: "var(--glass)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--fg-2)", fontSize: 11, fontWeight: 500 }}>Your share</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--fg-1)",
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 2,
                }}
              >
                {formatMoney(myBalance.share, currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member balances */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Group</h2>
        <span className="kicker">{members.length} members</span>
      </div>

      <div className="grid">
        {sorted.map((b) => {
          const isMe = b.member.id === myMemberId;
          const tone =
            b.balance > 0.01 ? "positive" : b.balance < -0.01 ? "negative" : "neutral";
          const label = b.balance > 0.01 ? "is owed" : b.balance < -0.01 ? "owes" : "settled";

          return (
            <div key={b.member.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <AvatarView
                  name={b.member.name}
                  color={b.member.avatar_color}
                  image={b.member.avatar_url}
                  size={44}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 15,
                        color: "var(--fg-1)",
                      }}
                    >
                      {isMe ? "You" : b.member.name}
                    </span>
                    {b.member.role === "owner" && (
                      <span className="chip info" style={{ fontSize: 10, padding: "3px 8px" }}>
                        Owner
                      </span>
                    )}
                    {b.member.role === "guest" && (
                      <span className="chip violet" style={{ fontSize: 10, padding: "3px 8px" }}>
                        Guest
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 4,
                      color: "var(--fg-2)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <span>
                      <span style={{ color: "var(--fg-3)" }}>Paid </span>
                      {formatMoney(b.paid, currency)}
                    </span>
                    <span>
                      <span style={{ color: "var(--fg-3)" }}>Share </span>
                      {formatMoney(b.share, currency)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className={tone === "positive" ? "positive" : tone === "negative" ? "negative" : ""}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 17,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                      color:
                        tone === "neutral" ? "var(--fg-2)" : undefined,
                    }}
                  >
                    {b.balance === 0
                      ? "—"
                      : `${b.balance > 0 ? "+" : "-"}${formatMoney(Math.abs(b.balance), currency)}`}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      color: "var(--fg-3)",
                      marginTop: 2,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {label}
                  </div>
                </div>
              </div>
              {/* Mini bar */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: "var(--glass)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${Math.min(100, (b.paid / Math.max(b.paid, b.share, 1)) * 100)}%`,
                      background: "linear-gradient(90deg, #5B8CFF, #B57BFF)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
