"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingCard } from "@/components/LoadingCard";

export function JoinTripPage({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tripName, setTripName] = useState("");
  const [tripId, setTripId] = useState("");
  const [error, setError] = useState("");
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push(`/login?next=/join/${inviteCode}`);
        return;
      }

      const { data: trip } = await supabase
        .from("trips")
        .select("id, name")
        .eq("invite_code", inviteCode.toUpperCase())
        .maybeSingle();

      if (!trip) {
        setError("Invalid invite code. Please check the link.");
        setLoading(false);
        return;
      }

      setTripId(trip.id);
      setTripName(trip.name);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (prof) {
        const { data: existing } = await supabase
          .from("trip_members")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("profile_id", prof.id)
          .maybeSingle();
        if (existing) {
          setAlreadyMember(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [inviteCode, router]);

  async function joinTrip() {
    setJoining(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      await supabase.from("trip_members").insert({
        trip_id: tripId,
        profile_id: prof?.id || null,
        name: prof?.name || authData.user.email?.split("@")[0] || "Member",
        phone: prof?.phone || null,
        upi_id: prof?.upi_id || null,
        role: "member",
      });

      router.push(`/trips/${tripId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join trip");
      setJoining(false);
    }
  }

  if (loading) return <LoadingCard label="Loading invite" />;

  if (error) {
    return (
      <div className="card emptyState">
        <span style={{ fontSize: 40 }}>❌</span>
        <h3>Invite error</h3>
        <p className="muted">{error}</p>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="card emptyState">
        <span style={{ fontSize: 40 }}>✅</span>
        <h3>Already a member</h3>
        <p className="muted">You&apos;re already part of &ldquo;{tripName}&rdquo;.</p>
        <button
          className="btn btnPrimary"
          onClick={() => router.push(`/trips/${tripId}`)}
          type="button"
        >
          Go to trip →
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="heroAurora">
        <div style={{ position: "relative" }}>
          <div className="kicker" style={{ color: "rgba(5,7,13,.6)", marginBottom: 6 }}>
            You&apos;ve been invited
          </div>
          <h1 style={{ color: "#05070D" }}>{tripName}</h1>
          <p style={{ color: "rgba(5,7,13,.7)", marginTop: 8 }}>
            Join this trip to start splitting expenses together.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>✈️</span>
          <h2>{tripName}</h2>
          <p className="muted">Tap below to join and start tracking expenses together.</p>
          <button
            className="btn btnPrimary"
            style={{ width: "100%" }}
            onClick={joinTrip}
            disabled={joining}
            type="button"
          >
            {joining ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <UserPlus size={18} />
            )}
            Join trip
          </button>
        </div>
      </div>
    </>
  );
}
