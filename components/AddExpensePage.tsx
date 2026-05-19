"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { TripMember, Trip } from "@/lib/types";

const CATEGORIES = [
  { name: "Food", emoji: "🍽️" },
  { name: "Petrol", emoji: "⛽" },
  { name: "Hotel", emoji: "🏨" },
  { name: "Tickets", emoji: "🎟️" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Transit", emoji: "🚕" },
  { name: "Drinks", emoji: "🍹" },
  { name: "Parking", emoji: "🅿️" },
  { name: "Other", emoji: "🧾" },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <>
      <h1>New Expense</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Amount */}
        <div className="card" style={{ textAlign: "center", padding: "24px 20px" }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Amount</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 52,
              letterSpacing: "-0.04em",
              color: "var(--fg-1)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              display: "inline-flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 28, color: "var(--fg-2)", fontWeight: 600 }}>
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
                background: "transparent",
                border: 0,
                outline: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 52,
                letterSpacing: "-0.04em",
                color: "var(--fg-1)",
                width: "6ch",
                minWidth: "3ch",
                textAlign: "center",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="field">
          <label className="fieldLabel">What&apos;s it for?</label>
          <input
            className="fieldInput"
            type="text"
            placeholder="e.g. Beach lunch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div>
          <div className="kicker" style={{ padding: "0 4px 10px" }}>Category</div>
          <div className="filterRail">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`filterChip ${category === c.name ? "active" : ""}`}
                onClick={() => setCategory(c.name)}
              >
                <span style={{ fontSize: 16 }}>{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Paid by */}
        <div className="field">
          <label className="fieldLabel">Paid by</label>
          <select
            className="fieldInput"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === myMemberId ? `You (${m.name})` : m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="field">
          <label className="fieldLabel">Date</label>
          <input
            className="fieldInput"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="field">
          <label className="fieldLabel">Notes (optional)</label>
          <input
            className="fieldInput"
            type="text"
            placeholder="Any note…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Split */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 4px 10px",
            }}
          >
            <div className="kicker">Split between</div>
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
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 16,
                    background: isOn ? "rgba(91,140,255,.08)" : "rgba(255,255,255,.03)",
                    border: `1px solid ${isOn ? "rgba(91,140,255,.22)" : "var(--glass)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      border: `1.5px solid ${isOn ? "var(--accent-blue)" : "rgba(255,255,255,.16)"}`,
                      background: isOn ? "var(--g-aurora)" : "transparent",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isOn && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5l3.5 3.5L11 1.5"
                          stroke="#05070D"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <AvatarView
                    name={member.name}
                    color={member.avatar_color}
                    image={member.avatar_url}
                    size={36}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--fg-1)",
                      }}
                    >
                      {member.id === myMemberId ? "You" : member.name}
                    </div>
                    <div style={{ color: "var(--fg-2)", fontSize: 11.5, fontWeight: 500 }}>
                      {isOn ? "Included" : "Tap to include"}
                    </div>
                  </div>
                  {isOn && perHead > 0 && (
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--fg-1)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatMoney(perHead, currency)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn btnPrimary"
          style={{ width: "100%" }}
          disabled={saving}
        >
          {saving ? (
            <span className="spinner" style={{ width: 18, height: 18 }} />
          ) : (
            <Check size={18} strokeWidth={2} />
          )}
          Save expense
        </button>
      </form>
    </>
  );
}
