"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { Settlement, TripMember, Trip } from "@/lib/types";

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

export function PaymentPage({ tripId, settlementId }: { tripId: string; settlementId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      const [tripRes, settlRes, membersRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("settlements").select("*").eq("id", settlementId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
      ]);
      setTrip(tripRes.data);
      setSettlement(settlRes.data);
      setMembers(membersRes.data || []);
      setLoading(false);
    }
    load();
  }, [tripId, settlementId]);

  async function markPaid() {
    setPaying(true);
    await supabase
      .from("settlements")
      .update({ status: "paid_by_sender", paid_at: new Date().toISOString() })
      .eq("id", settlementId);
    router.push(`/trips/${tripId}/settlements`);
  }

  async function confirmReceived() {
    setConfirming(true);
    await supabase
      .from("settlements")
      .update({ status: "confirmed_by_receiver", confirmed_at: new Date().toISOString() })
      .eq("id", settlementId);
    router.push(`/trips/${tripId}/settlements`);
  }

  if (loading) return <LoadingCard label="Loading payment" />;
  if (!settlement) return <div className="card emptyState"><p>Settlement not found.</p></div>;

  const fromMember = members.find((m) => m.id === settlement.from_member_id);
  const toMember = members.find((m) => m.id === settlement.to_member_id);
  const currency = trip?.currency || "INR";

  const upiUrl = toMember?.upi_id
    ? `upi://pay?pa=${toMember.upi_id}&pn=${encodeURIComponent(toMember.name)}&am=${settlement.amount}&cu=${currency}&tn=${encodeURIComponent(settlement.payment_note || "TripSplits")}`
    : null;

  return (
    <>
      {/* Full glass card with QR */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 28,
          padding: 22,
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
          marginBottom: 16,
        }}
      >
        {/* Amount display */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              marginBottom: 6,
            }}
          >
            Amount to pay
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 48,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: "var(--fg-1)",
            }}
          >
            {formatMoney(settlement.amount, currency)}
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-2)",
            }}
          >
            {fromMember && (
              <AvatarView name={fromMember.name} size={28} color={fromMember.avatar_color} />
            )}
            <span>{fromMember?.name || "?"}</span>
            <span>→</span>
            {toMember && (
              <AvatarView name={toMember.name} size={28} color={toMember.avatar_color} />
            )}
            <span>{toMember?.name || "?"}</span>
          </div>
        </div>

        {/* QR + recipient info row */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
          {/* White bg QR box 110×110 */}
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
            {/* "Pay to" eyebrow */}
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
            {/* Recipient name */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--fg-1)",
                marginTop: 2,
              }}
            >
              {toMember?.name || "?"}
            </div>
            {/* UPI ID mono */}
            {toMember?.upi_id && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-2)",
                  marginTop: 6,
                  wordBreak: "break-all",
                }}
              >
                {toMember.upi_id}
              </div>
            )}
            {/* UPI / GPay chips */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span className="chip info" style={{ fontSize: 11, padding: "4px 9px" }}>UPI QR</span>
              <span className="chip" style={{ fontSize: 11, padding: "4px 9px" }}>GPay · PhonePe</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* Pay now aurora button */}
          {upiUrl ? (
            <a
              href={upiUrl}
              className="btn btnPrimary"
              style={{ flex: 1 }}
            >
              Pay now
            </a>
          ) : (
            <button
              className="btn btnPrimary"
              style={{ flex: 1 }}
              onClick={markPaid}
              disabled={paying}
              type="button"
            >
              {paying ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              Pay now
            </button>
          )}
          {/* I have paid glass button */}
          <button
            className="btn btnGlass"
            onClick={markPaid}
            disabled={paying}
            type="button"
          >
            {paying ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            I have paid
          </button>
        </div>
      </div>

      {/* Confirm received button (for recipient) */}
      {settlement.status === "paid_by_sender" && (
        <button
          className="btn btnGlass"
          style={{ width: "100%" }}
          onClick={confirmReceived}
          disabled={confirming}
          type="button"
        >
          {confirming ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
          Confirm received
        </button>
      )}
    </>
  );
}
