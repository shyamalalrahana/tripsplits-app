"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { TripMember, Trip } from "@/lib/types";

const CATEGORIES = [
  { name: "Food",     emoji: "🍽️", grad: "linear-gradient(135deg,#FF8A5B,#FF6BC9)" },
  { name: "Petrol",   emoji: "⛽",  grad: "linear-gradient(135deg,#FFC55B,#FF8A5B)" },
  { name: "Hotel",    emoji: "🏨",  grad: "linear-gradient(135deg,#5B8CFF,#B57BFF)" },
  { name: "Tickets",  emoji: "🎟️",  grad: "linear-gradient(135deg,#B57BFF,#FF6BC9)" },
  { name: "Shopping", emoji: "🛍️",  grad: "linear-gradient(135deg,#FF6BC9,#B57BFF)" },
  { name: "Transit",  emoji: "🚕",  grad: "linear-gradient(135deg,#2A6CFF,#3DE1B1)" },
  { name: "Drinks",   emoji: "🍹",  grad: "linear-gradient(135deg,#FF6BC9,#FFC55B)" },
  { name: "Parking",  emoji: "🅿️",  grad: "linear-gradient(135deg,#5B8CFF,#2A6CFF)" },
  { name: "Other",    emoji: "🧾",  grad: "linear-gradient(135deg,#6A7497,#A6B0D4)" },
];

export function AddExpensePage({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paidBy, setPaidBy] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [included, setIncluded] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const [tripRes, membersRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
      ]);
      setTrip(tripRes.data);
      const mems: TripMember[] = membersRes.data || [];
      setMembers(mems);
      setIncluded(mems.map((m) => m.id));

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
          setPaidBy(myM?.id || mems[0]?.id || "");
        } else {
          setPaidBy(mems[0]?.id || "");
        }
      } else {
        setPaidBy(mems[0]?.id || "");
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  async function handleSubmit() {
    if (!amount || !title || !paidBy) return;
    setSaving(true);
    const amt = parseFloat(amount);
    const { data: exp } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        title,
        amount: amt,
        category,
        paid_by_member_id: paidBy,
        expense_date: date,
        notes: notes || null,
      })
      .select()
      .single();

    if (exp && included.length > 0) {
      const splitAmt = amt / included.length;
      await supabase.from("expense_splits").insert(
        included.map((memberId) => ({
          expense_id: exp.id,
          member_id: memberId,
          split_amount: splitAmt,
          split_type: "equal",
        }))
      );
    }
    setSaving(false);
    router.push(`/trips/${tripId}`);
  }

  if (loading) return <LoadingCard label="Loading" />;

  const amt = parseFloat(amount) || 0;
  const perHead = included.length > 0 ? amt / included.length : 0;
  const currency = trip?.currency || "INR";
  const paidByMember = members.find((m) => m.id === paidBy);

  return (
    /* Bottom-sheet style — matches AddExpenseScreen from design */
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,7,13,.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{
        background: "linear-gradient(180deg, #1A2240 0%, #0B1020 100%)",
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        border: "1px solid rgba(255,255,255,.08)", borderBottom: 0,
        maxHeight: "92vh", overflow: "auto",
        boxShadow: "0 -32px 80px -10px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.12)",
        padding: "12px 20px 100px",
        scrollbarWidth: "none",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(255,255,255,.16)" }} />
        </div>

        {/* Header — Cancel / Title / Save */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}`)}
            style={{ background: "transparent", border: 0, color: "var(--fg-2)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Cancel
          </button>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--fg-1)" }}>New expense</div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !amount || !title}
            style={{ background: "transparent", border: 0, color: "var(--accent-blue)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!amount || !title) ? 0.4 : 1 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Big amount input — matches design's gradient text */}
        <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg-3)" }}>Amount</div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 60,
            letterSpacing: "-0.04em", color: "var(--fg-1)", marginTop: 6,
            fontVariantNumeric: "tabular-nums", lineHeight: 1,
            display: "inline-flex", alignItems: "baseline", gap: 4,
          }}>
            <span style={{ fontSize: 32, color: "var(--fg-2)", fontWeight: 600, marginRight: 2 }}>
              {currency === "INR" ? "₹" : "$"}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              style={{
                border: 0, outline: "none",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 60,
                letterSpacing: "-0.04em",
                background: amount ? "var(--g-aurora)" : "transparent",
                WebkitBackgroundClip: amount ? "text" : "unset",
                backgroundClip: amount ? "text" : "unset",
                color: amount ? "transparent" : "var(--fg-2)",
                width: "5ch", minWidth: "3ch", textAlign: "center",
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          placeholder="What's it for?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 18,
            padding: "14px 18px", color: "var(--fg-1)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16,
            outline: "none", marginBottom: 14,
          }}
        />

        {/* Category — vertical tile grid like the design */}
        <div style={{ fontFamily: "var(--font-display)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg-3)", padding: "8px 4px" }}>Category</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20, marginBottom: 16, scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => {
            const active = category === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                style={{
                  flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "10px 4px 8px", width: 64, borderRadius: 16,
                  background: active ? "rgba(91,140,255,.12)" : "transparent",
                  border: `1px solid ${active ? "rgba(91,140,255,.32)" : "transparent"}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 14, background: c.grad, display: "grid", placeItems: "center", fontSize: 20, boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px -4px rgba(0,0,0,.4)" }}>
                  <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))" }}>{c.emoji}</span>
                </div>
                <span style={{ color: active ? "var(--fg-1)" : "var(--fg-2)", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-display)" }}>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Paid by */}
        <div style={{ fontFamily: "var(--font-display)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg-3)", padding: "0 4px 8px" }}>Paid by</div>
        <div style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
          border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 14,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 14,
          position: "relative",
        }}>
          <AvatarView name={paidByMember?.name || "?"} color={paidByMember?.avatar_color} image={paidByMember?.avatar_url} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>
              {paidBy === myMemberId ? "You" : paidByMember?.name || "?"}
            </div>
            <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500 }}>paying</div>
          </div>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-3)" }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Date */}
        <div style={{ fontFamily: "var(--font-display)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg-3)", padding: "0 4px 8px" }}>Date</div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "100%", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 18,
            padding: "14px 18px", color: "var(--fg-1)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15,
            outline: "none", marginBottom: 14,
          }}
        />

        {/* Notes */}
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: "100%", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 18,
            padding: "14px 18px", color: "var(--fg-1)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15,
            outline: "none", marginBottom: 16,
          }}
        />

        {/* Split */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg-3)" }}>Split</span>
          {perHead > 0 && (
            <span style={{ color: "var(--accent-blue)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12 }}>
              {formatMoney(perHead, currency)} each
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((member) => {
            const isOn = included.includes(member.id);
            return (
              <div
                key={member.id}
                onClick={() =>
                  setIncluded((prev) =>
                    isOn ? prev.filter((x) => x !== member.id) : [...prev, member.id]
                  )
                }
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 16,
                  background: isOn ? "rgba(91,140,255,.08)" : "rgba(255,255,255,.03)",
                  border: `1px solid ${isOn ? "rgba(91,140,255,.22)" : "var(--glass)"}`,
                  cursor: "pointer",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 7,
                  border: `1.5px solid ${isOn ? "var(--accent-blue)" : "rgba(255,255,255,.16)"}`,
                  background: isOn ? "var(--g-aurora)" : "transparent",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  {isOn && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1.5" stroke="#05070D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <AvatarView name={member.name} color={member.avatar_color} image={member.avatar_url} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>
                    {member.id === myMemberId ? "You" : member.name}
                  </div>
                  <div style={{ color: "var(--fg-2)", fontSize: 11.5, fontWeight: 500 }}>
                    {isOn ? "Included in split" : "Tap to include"}
                  </div>
                </div>
                {isOn && perHead > 0 && (
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "var(--fg-1)", fontVariantNumeric: "tabular-nums" }}>
                    {formatMoney(perHead, currency)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
