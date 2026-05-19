export function LoadingCard({ label = "Loading" }: { label?: string }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 24 }}>
      <div className="spinner" />
      <span className="muted">{label}…</span>
    </div>
  );
}
