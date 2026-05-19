"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Check, X, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingCard } from "@/components/LoadingCard";
import type { Profile, Trip } from "@/lib/types";

export function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDest, setEditDest] = useState("");

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      setProfile(p);

      const { data: members } = await supabase
        .from("trip_members")
        .select("trip_id")
        .eq("profile_id", p?.id || "");

      if (members && members.length > 0) {
        const tripIds = members.map((m) => m.trip_id);
        const { data: tripData } = await supabase
          .from("trips")
          .select("*")
          .in("id", tripIds)
          .order("created_at", { ascending: false });
        setTrips(tripData || []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function deleteTrip(id: string) {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    await supabase.from("trips").delete().eq("id", id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  async function saveEdit(id: string) {
    await supabase
      .from("trips")
      .update({ name: editName, destination: editDest })
      .eq("id", id);
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: editName, destination: editDest } : t))
    );
    setEditingId(null);
  }

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  if (loading) {
    return (
      <div className="page">
        <LoadingCard label="Loading trips" />
      </div>
    );
  }

  return (
    <>
      {/* Greeting hero */}
      <div className="heroAurora">
        <div style={{ position: "relative" }}>
          <div className="kicker" style={{ color: "rgba(5,7,13,.6)", marginBottom: 6 }}>
            {greeting}
          </div>
          <h1 style={{ color: "#05070D", fontSize: 28, marginBottom: 8 }}>
            {profile?.name || "Traveller"} ✈️
          </h1>
          <p style={{ color: "rgba(5,7,13,.7)", fontSize: 14, lineHeight: 1.5 }}>
            {trips.length === 0
              ? "Create your first trip to get started."
              : `You have ${trips.length} trip${trips.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      {/* Create trip button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Your Trips</h2>
        <Link href="/trips/new" className="btn btnPrimary" style={{ fontSize: 13, padding: "10px 18px" }}>
          <Plus size={16} strokeWidth={2.2} />
          New Trip
        </Link>
      </div>

      {/* Trip list */}
      {trips.length === 0 ? (
        <div className="card emptyState">
          <div style={{ fontSize: 40 }}>🗺️</div>
          <div>
            <h3 style={{ marginBottom: 6 }}>No trips yet</h3>
            <p className="muted">Create a trip to start splitting expenses.</p>
          </div>
          <Link href="/trips/new" className="btn btnPrimary">
            <Plus size={16} />
            Create Trip
          </Link>
        </div>
      ) : (
        <div className="grid">
          {trips.map((trip) => (
            <div key={trip.id} className="card">
              <div className="tripCardMain">
                <Link href={`/trips/${trip.id}`} className="tripCardLink">
                  <div className="tripThumb">
                    {(trip.name || "T")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "var(--fg-1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {trip.name}
                    </div>
                    {trip.destination && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "var(--fg-2)",
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        <MapPin size={12} strokeWidth={1.6} />
                        {trip.destination}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <span className="chip info" style={{ fontSize: 11, padding: "3px 8px" }}>
                        {trip.currency}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="tripCardActions">
                  <button
                    className="btnIcon"
                    onClick={() => {
                      setEditingId(trip.id);
                      setEditName(trip.name);
                      setEditDest(trip.destination || "");
                    }}
                    type="button"
                    aria-label="Edit trip"
                  >
                    <Pencil size={15} strokeWidth={1.6} />
                  </button>
                  <button
                    className="btnIcon danger"
                    onClick={() => deleteTrip(trip.id)}
                    type="button"
                    aria-label="Delete trip"
                  >
                    <Trash2 size={15} strokeWidth={1.6} />
                  </button>
                </div>
              </div>

              {editingId === trip.id && (
                <div className="tripEditForm">
                  <div className="field">
                    <label className="fieldLabel">Trip name</label>
                    <input
                      className="fieldInput"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="fieldLabel">Destination</label>
                    <input
                      className="fieldInput"
                      value={editDest}
                      onChange={(e) => setEditDest(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btnPrimary"
                      style={{ fontSize: 13, padding: "10px 18px" }}
                      onClick={() => saveEdit(trip.id)}
                      type="button"
                    >
                      <Check size={15} />
                      Save
                    </button>
                    <button
                      className="btn btnGlass"
                      style={{ fontSize: 13, padding: "10px 18px" }}
                      onClick={() => setEditingId(null)}
                      type="button"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
