"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Plus, ReceiptText, Scale, UserRound, Users, WalletCards } from "lucide-react";
import { AvatarView } from "@/components/AvatarView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export function AppShell({
  children,
  tripId,
}: {
  children: React.ReactNode;
  tripId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .select("id,user_id,name,email,phone,upi_id,avatar_color,avatar_url")
        .eq("user_id", data.user.id)
        .maybeSingle()
        .then(({ data: p }) => setProfile(p));
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navItems = tripId
    ? [
        { href: `/trips/${tripId}`, label: "Trip", icon: WalletCards },
        { href: `/trips/${tripId}/expenses`, label: "Activity", icon: ReceiptText },
        { href: `/trips/${tripId}/expenses/new`, label: "Add", icon: Plus, isAdd: true },
        { href: `/trips/${tripId}/balances`, label: "Balances", icon: Scale },
        { href: `/trips/${tripId}/settlements`, label: "Settle", icon: Users },
      ]
    : [];

  return (
    <div className="shell">
      {/* Background atmosphere blobs — matches StageBlobs from design */}
      <div className="stageBlobs" aria-hidden="true">
        <div className="stageBlobPink" />
      </div>
      <header className="topbar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brandMark">✈️</div>
          <span className="brandName">TripSplits</span>
        </Link>
        <div className="topActions">
          <ThemeToggle />
          <div className="profileMenu">
            <button
              className="profileButton"
              onClick={() => setMenuOpen((o) => !o)}
              type="button"
              aria-expanded={menuOpen}
            >
              <AvatarView
                name={profile?.name || "User"}
                color={profile?.avatar_color}
                image={profile?.avatar_url}
                size={30}
                style={{ borderRadius: 9 }}
              />
              <div className="profileButtonText">
                <strong>{profile?.name || "Profile"}</strong>
                <small>Account</small>
              </div>
            </button>
            {menuOpen && (
              <div className="profileDropdown">
                <Link
                  className="profileDropdownItem"
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound size={17} strokeWidth={1.6} />
                  <span>Profile</span>
                </Link>
                <button
                  className="profileDropdownItem dangerText"
                  onClick={logout}
                  type="button"
                >
                  <LogOut size={17} strokeWidth={1.6} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      {tripId && (
        <nav className="bottomNav" aria-label="Trip navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isAdd) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bottomNavAdd"
                  aria-label="Add expense"
                >
                  <Icon size={24} strokeWidth={2.2} />
                </Link>
              );
            }
            const isActive =
              item.href === `/trips/${tripId}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottomNavItem ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="navIcon">
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
