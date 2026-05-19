"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  CreditCard,
  Bell,
  LogOut,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { imageFileToDataUrl } from "@/lib/avatar";
import type { Profile } from "@/lib/types";

export function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUpi, setEditUpi] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

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
      setLoading(false);
    }
    load();
  }, [router]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      try {
        avatar_url = await imageFileToDataUrl(avatarFile);
      } catch {
        // keep existing
      }
    }
    await supabase
      .from("profiles")
      .update({ name: editName, phone: editPhone, upi_id: editUpi, avatar_url })
      .eq("id", profile.id);
    setProfile((p) => (p ? { ...p, name: editName, phone: editPhone, upi_id: editUpi, avatar_url } : p));
    setEditing(false);
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <LoadingCard label="Loading profile" />;
  if (!profile) return null;

  return (
    <>
      {/* Header aurora card */}
      <div
        style={{
          position: "relative",
          borderRadius: 32,
          overflow: "hidden",
          background: "var(--g-aurora)",
          backgroundSize: "200% 200%",
          animation: "ts-gradient-pan 14s linear infinite",
          padding: "24px 22px 22px",
          boxShadow: "var(--shadow-3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(80% 60% at 100% 0%, rgba(255,255,255,.32), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <AvatarView
              name={profile.name}
              color={profile.avatar_color}
              image={profile.avatar_url}
              size={72}
              style={{
                borderRadius: 22,
                boxShadow: "0 0 0 4px rgba(255,255,255,.32), inset 0 1px 0 rgba(255,255,255,.5)",
              }}
            />
          </div>
          <div style={{ color: "#05070D" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: "-0.02em",
              }}
            >
              {profile.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12.5,
                color: "rgba(5,7,13,.7)",
                marginTop: 2,
              }}
            >
              {profile.email}
            </div>
            {profile.upi_id && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "rgba(5,7,13,.6)",
                  marginTop: 4,
                }}
              >
                {profile.upi_id}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile section */}
      <div className="sectionLabel">Account</div>

      <div className="card">
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="fieldLabel">Name</label>
              <input
                className="fieldInput"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="fieldLabel">Phone</label>
              <input
                className="fieldInput"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 9999999999"
              />
            </div>
            <div className="field">
              <label className="fieldLabel">UPI ID</label>
              <input
                className="fieldInput"
                value={editUpi}
                onChange={(e) => setEditUpi(e.target.value)}
                placeholder="yourname@bank"
              />
            </div>
            <div className="field">
              <label className="fieldLabel">Profile photo</label>
              <input
                type="file"
                accept="image/*"
                className="fieldInput"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btnPrimary"
                style={{ fontSize: 13, padding: "10px 18px" }}
                onClick={saveProfile}
                disabled={saving}
                type="button"
              >
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={15} />}
                Save
              </button>
              <button
                className="btn btnGlass"
                style={{ fontSize: 13, padding: "10px 18px" }}
                onClick={() => setEditing(false)}
                type="button"
              >
                <X size={15} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profileRows">
            <div className="profileRow">
              <span className="profileRowIcon">
                <UserRound size={16} strokeWidth={1.6} />
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--fg-1)",
                  }}
                >
                  {profile.name}
                </div>
                <div style={{ color: "var(--fg-2)", fontSize: 12, marginTop: 2 }}>
                  {profile.email}
                </div>
              </div>
              <button
                className="btnIcon"
                onClick={() => {
                  setEditing(true);
                  setEditName(profile.name);
                  setEditPhone(profile.phone || "");
                  setEditUpi(profile.upi_id || "");
                }}
                type="button"
                aria-label="Edit profile"
              >
                <Pencil size={14} strokeWidth={1.6} />
              </button>
            </div>
            {profile.upi_id && (
              <div className="profileRow">
                <span className="profileRowIcon">
                  <CreditCard size={16} strokeWidth={1.6} />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--fg-1)",
                    }}
                  >
                    UPI ID
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                    {profile.upi_id}
                  </div>
                </div>
                <span className="chip positive" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Set
                </span>
              </div>
            )}
            {profile.phone && (
              <div className="profileRow">
                <span className="profileRowIcon">
                  <Bell size={16} strokeWidth={1.6} />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--fg-1)",
                    }}
                  >
                    Phone
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                    {profile.phone}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sectionLabel">Help</div>

      <div className="card">
        <div className="profileRows">
          <div className="profileRow" style={{ cursor: "pointer" }} onClick={logout}>
            <span className="profileRowIcon danger">
              <LogOut size={16} strokeWidth={1.6} />
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--accent-orange)",
                }}
              >
                Log out
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          color: "var(--fg-3)",
          fontSize: 11,
          fontWeight: 500,
          paddingBottom: 16,
        }}
      >
        TripSplits · made for travellers
      </div>
    </>
  );
}
