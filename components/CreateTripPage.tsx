"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED", "JPY"];

export function CreateTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");

      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      const inviteCode = Math.random().toString(36).slice(2, 10).toUpperCase();

      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .insert({
          name,
          destination: destination || null,
          currency,
          start_date: startDate || null,
          end_date: endDate || null,
          created_by: prof?.id || null,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (tripErr) throw tripErr;

      // Add creator as owner member
      if (trip && prof) {
        await supabase.from("trip_members").insert({
          trip_id: trip.id,
          profile_id: prof.id,
          name: authData.user.email?.split("@")[0] || "Me",
          role: "owner",
        });
      }

      router.push(`/trips/${trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="heroAurora">
        <div style={{ position: "relative" }}>
          <div className="kicker" style={{ color: "rgba(5,7,13,.6)", marginBottom: 6 }}>
            New trip
          </div>
          <h1 style={{ color: "#05070D" }}>Where are you going?</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label className="fieldLabel">Trip name</label>
          <input
            className="fieldInput"
            type="text"
            placeholder="e.g. Goa Trip 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="fieldLabel">Destination</label>
          <input
            className="fieldInput"
            type="text"
            placeholder="e.g. Goa, India"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="fieldLabel">Currency</label>
          <select
            className="fieldInput"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid2">
          <div className="field">
            <label className="fieldLabel">Start date</label>
            <input
              className="fieldInput"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="fieldLabel">End date</label>
            <input
              className="fieldInput"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              background: "var(--tint-orange)",
              color: "var(--accent-orange)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btnPrimary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" style={{ width: 18, height: 18 }} />
          ) : (
            <Plus size={18} strokeWidth={2.2} />
          )}
          Create trip
        </button>
      </form>
    </>
  );
}
