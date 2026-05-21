"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { imageFileToDataUrl } from "@/lib/avatar";
import type { Profile } from "@/lib/types";

// ── Icon primitives ──────────────────────────────────────────────────
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="6.5" r="2.3" /><path d="M16 13c2.8 0 5 2.2 5 5" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M3 14l8-2 5-8 2 1-3 9 6-1 1 2-6 3-1 6-2-1-1-6-9 3-1-2 5-3-4-1Z" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
    </svg>
  );
}
function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
    </svg>
  );
}
function LogoutSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// ── Row component ────────────────────────────────────────────────────
function Row({
  icon,
  label,
  sub,
  action,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          background: danger ? "var(--tint-orange)" : "var(--tint-blue)",
          color: danger ? "var(--accent-orange)" : "var(--accent-blue)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 14,
            color: danger ? "var(--accent-orange)" : "var(--fg-1)",
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ color: "var(--fg-2)", fontSize: 12, fontWeight: 500, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {action || (onClick && !danger && (
        <span style={{ color: "var(--fg-3)" }}>
          <ChevronIcon />
        </span>
      ))}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--line)", margin: "0 16px" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--fg-3)",
        letterSpacing: ".18em",
        textTransform: "uppercase",
        padding: "12px 6px 10px",
      }}
    >
      {children}
    </div>
  );
}

function GlassCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 22,
        overflow: "hidden",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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
      {/* Aurora gradient header card */}
      <div className="profileHeroCard" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
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
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "rgba(5,7,13,.18)",
                  color: "#05070D",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                3 trips
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "rgba(5,7,13,.18)",
                  color: "#05070D",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                12 friends
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "You're owed", value: "—", color: "var(--accent-green)" },
          { label: "Lifetime spent", value: "—", color: "var(--accent-blue)" },
          { label: "Settled", value: "0", color: "var(--fg-1)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 20,
              padding: 14,
              backdropFilter: "blur(24px) saturate(140%)",
              WebkitBackdropFilter: "blur(24px) saturate(140%)",
            }}
          >
            <div style={{ color: "var(--fg-2)", fontSize: 11, fontWeight: 500 }}>{label}</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
                color,
                marginTop: 6,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Account section */}
      <SectionLabel>Account</SectionLabel>

      {editing ? (
        <div
          className="card"
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="fieldLabel">Name</label>
              <input
                className="fieldInput"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
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
        </div>
      ) : (
        <GlassCard>
          <Row
            icon={<UsersIcon />}
            label="Edit profile"
            sub="Name, photo, phone"
            onClick={() => {
              setEditing(true);
              setEditName(profile.name);
              setEditPhone(profile.phone || "");
              setEditUpi(profile.upi_id || "");
            }}
          />
          <Divider />
          <Row
            icon={<CardIcon />}
            label="UPI ID"
            sub={
              profile.upi_id ? (
                <span style={{ fontFamily: "var(--font-mono)" }}>{profile.upi_id}</span>
              ) : (
                "Not set"
              )
            }
            action={
              profile.upi_id ? (
                <span className="chip positive" style={{ fontSize: 10 }}>Verified</span>
              ) : undefined
            }
          />
          <Divider />
          <Row
            icon={<BellIcon />}
            label="Notifications"
            sub="Push, email"
          />
          <Divider />
          <Row
            icon={<GlobeIcon />}
            label="Currency"
            sub="INR (₹)"
            action={<span style={{ color: "var(--fg-3)" }}><ChevronIcon /></span>}
          />
        </GlassCard>
      )}

      {/* Trips section */}
      <SectionLabel>Trips</SectionLabel>
      <GlassCard>
        <Row
          icon={<PlaneIcon />}
          label="Your trips"
          sub="Active trips"
          action={<span style={{ color: "var(--fg-3)" }}><ChevronIcon /></span>}
        />
        <Divider />
        <Row
          icon={<UsersIcon />}
          label="Friends"
          sub="Your travel group"
          action={<span style={{ color: "var(--fg-3)" }}><ChevronIcon /></span>}
        />
        <Divider />
        <Row
          icon={<ReceiptIcon />}
          label="Export expenses"
          sub="CSV · PDF"
        />
      </GlassCard>

      {/* Help section */}
      <SectionLabel>Help</SectionLabel>
      <GlassCard>
        <Row
          icon={<SparkleIcon />}
          label="What's new"
          sub="v2.0 · TripSplits dark"
        />
        <Divider />
        <Row
          icon={<QrIcon />}
          label="Privacy & data"
        />
        <Divider />
        <Row
          icon={<LogoutSvg />}
          label="Log out"
          danger
          onClick={logout}
        />
      </GlassCard>

      <div
        style={{
          textAlign: "center",
          color: "var(--fg-3)",
          fontSize: 11,
          fontWeight: 500,
          paddingBottom: 16,
        }}
      >
        TripSplits · v2.0 · made for travellers
      </div>
    </>
  );
}
