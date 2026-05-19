"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AvatarView } from "@/components/AvatarView";
import { LoadingCard } from "@/components/LoadingCard";
import { calculateBalances, formatMoney } from "@/lib/calculations";
import type { TripMember, Trip, Expense, ExpenseSplit } from "@/lib/types";

export function MembersPage({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [balances, setBalances] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [tripCreatedBy, setTripCreatedBy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editUpi, setEditUpi] = useState("");

  useEffect(() => {
    async function load() {
      const [tripRes, membersRes, expensesRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("trip_members").select("*").eq("trip_id", tripId),
        supabase.from("expenses").select("*").eq("trip_id", tripId),
      ]);
      const mems: TripMember[] = membersRes.data || [];
      const expenses: Expense[] = expensesRes.data || [];
      setTrip(tripRes.data);
      setMembers(mems);
      setTripCreatedBy(tripRes.data?.created_by || null);

      let splits: ExpenseSplit[] = [];
      if (expenses.length > 0) {
        const { data: splitsData } = await supabase
          .from("expense_splits")
          .select("*")
          .in("expense_id", expenses.map((e) => e.id));
        splits = splitsData || [];
      }
      const bals = calculateBalances(mems, expenses, splits);
      const balMap = new Map<string, number>();
      bals.forEach((b) => balMap.set(b.member.id, b.balance));
      setBalances(balMap);

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
        }
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  async function deleteMember(id: string) {
    if (!confirm("Remove this member?")) return;
    await supabase.from("trip_members").delete().eq("id", id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function saveEdit(id: string) {
    await supabase
      .from("trip_members")
      .update({ name: editName, phone: editPhone, upi_id: editUpi })
      .eq("id", id);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name: editName, phone: editPhone, upi_id: editUpi } : m
      )
    );
    setEditingId(null);
  }

  if (loading) return <LoadingCard label="Loading members" />;

  const currency = trip?.currency || "INR";
  const isOwner =
    members.find((m) => m.id === myMemberId)?.role === "owner" ||
    members.find((m) => m.id === myMemberId)?.profile_id === tripCreatedBy;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Members</h1>
        <span className="chip info">{members.length} people</span>
      </div>

      <div className="grid2">
        {members.map((member) => {
          const bal = balances.get(member.id) || 0;
          const tone = bal > 0.01 ? "positive" : bal < -0.01 ? "negative" : "settled";
          const isMe = member.id === myMemberId;

          return (
            <div key={member.id} className="card memberCard">
              <div className="memberHero">
                <AvatarView
                  name={member.name}
                  color={member.avatar_color}
                  image={member.avatar_url}
                  size={48}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--fg-1)",
                    }}
                  >
                    {isMe ? "You" : member.name}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span className={`chip ${tone}`} style={{ fontSize: 10, padding: "3px 8px" }}>
                      {bal === 0 ? "Settled" : bal > 0 ? `+${formatMoney(bal, currency)}` : formatMoney(bal, currency)}
                    </span>
                    <span className="chip violet" style={{ fontSize: 10, padding: "3px 8px" }}>
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              {editingId === member.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="field">
                    <label className="fieldLabel">Name</label>
                    <input className="fieldInput" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="fieldLabel">Phone</label>
                    <input className="fieldInput" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="fieldLabel">UPI ID</label>
                    <input className="fieldInput" value={editUpi} onChange={(e) => setEditUpi(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btnPrimary" style={{ fontSize: 12, padding: "9px 14px" }} onClick={() => saveEdit(member.id)} type="button">Save</button>
                    <button className="btn btnGlass" style={{ fontSize: 12, padding: "9px 14px" }} onClick={() => setEditingId(null)} type="button">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="memberMeta">
                    {member.phone && (
                      <div>
                        <p>Phone</p>
                        <b className="mono" style={{ fontSize: 12 }}>{member.phone}</b>
                      </div>
                    )}
                    {member.upi_id && (
                      <div>
                        <p>UPI</p>
                        <b className="mono" style={{ fontSize: 12 }}>{member.upi_id}</b>
                      </div>
                    )}
                  </div>

                  {isOwner && (
                    <div className="memberActions">
                      <button
                        className="btn btnGlass"
                        style={{ fontSize: 12, padding: "9px 14px" }}
                        onClick={() => {
                          setEditingId(member.id);
                          setEditName(member.name);
                          setEditPhone(member.phone || "");
                          setEditUpi(member.upi_id || "");
                        }}
                        type="button"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      {!isMe && (
                        <button
                          className="btn btnDanger"
                          style={{ fontSize: 12, padding: "9px 14px" }}
                          onClick={() => deleteMember(member.id)}
                          type="button"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
