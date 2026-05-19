"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { formatMoney } from "@/lib/calculations";
import type { Settlement, TripMember, Trip } from "@/lib/types";

export function PaymentPage({ tripId, settlementId }: { tripId: string; settlementId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

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

  if (loading) return <LoadingCard label="Loading payment" />;
  if (!settlement) return <div className="card emptyState"><p>Settlement not found.</p></div>;

  const fromMember = members.find((m) => m.id === settlement.from_member_id);
  const toMember = members.find((m) => m.id === settlement.to_member_id);
  const currency = trip?.currency || "INR";

  // Build UPI payment URL
  const upiUrl = toMember?.upi_id
    ? `upi://pay?pa=${toMember.upi_id}&pn=${encodeURIComponent(toMember.name)}&am=${settlement.amount}&cu=${currency}&tn=${encodeURIComponent(settlement.payment_note || "TripSplits")}`
    : null;

  return (
    <>
      <h1>Pay</h1>

      {/* Amount hero */}
      <div className="heroAurora">
        <div style={{ position: "relative" }}>
          <div className="kicker" style={{ color: "rgba(5,7,13,.6)", marginBottom: 6 }}>
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
              color: "#05070D",
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
              color: "rgba(5,7,13,.7)",
            }}
          >
            {fromMember && <AvatarView name={fromMember.name} size={28} color={fromMember.avatar_color} />}
            <span>{fromMember?.name || "?"}</span>
            <span>→</span>
            {toMember && <AvatarView name={toMember.name} size={28} color={toMember.avatar_color} />}
            <span>{toMember?.name || "?"}</span>
          </div>
        </div>
      </div>

      {/* QR code */}
      {upiUrl && (
        <div className="card qrCard">
          <div className="kicker">Scan to pay with any UPI app</div>
          <div
            style={{
              padding: 16,
              background: "white",
              borderRadius: 20,
              display: "inline-block",
            }}
          >
            <QRCodeSVG value={upiUrl} size={180} />
          </div>
          <div>
            <div style={{ color: "var(--fg-2)", fontSize: 13, marginBottom: 6 }}>Pay to</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--fg-1)",
              }}
            >
              {toMember?.name}
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>
              {toMember?.upi_id}
            </div>
          </div>
          <div className="cluster">
            <span className="chip info">UPI QR</span>
            <span className="chip">GPay · PhonePe · Paytm</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {upiUrl && (
          <a
            href={upiUrl}
            className="btn btnPrimary"
            style={{ width: "100%" }}
          >
            <CreditCard size={18} />
            Open UPI App
          </a>
        )}
        <button
          className="btn btnGlass"
          style={{ width: "100%" }}
          onClick={markPaid}
          disabled={paying}
          type="button"
        >
          {paying ? (
            <span className="spinner" style={{ width: 16, height: 16 }} />
          ) : (
            <Check size={18} />
          )}
          I&apos;ve paid — mark as done
        </button>
      </div>
    </>
  );
}
