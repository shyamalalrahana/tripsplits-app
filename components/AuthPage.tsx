"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          await supabase.from("profiles").upsert({
            user_id: data.user.id,
            name: name || email.split("@")[0],
            email,
          });
        }
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Cover band */}
      <div
        style={{
          position: "relative",
          height: 320,
          marginBottom: -56,
          overflow: "hidden",
          background: "linear-gradient(135deg, #1A2240 0%, #2A6CFF 40%, #B57BFF 70%, #FF6BC9 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,7,13,0) 40%, rgba(5,7,13,.65) 80%, var(--ink-1) 100%)",
          }}
        />
        {/* Wordmark */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 22,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "var(--g-aurora)",
              backgroundSize: "200% 200%",
              animation: "ts-gradient-pan 14s linear infinite",
              display: "grid",
              placeItems: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 20px -4px rgba(91,140,255,.45)",
              fontSize: 20,
            }}
          >
            ✈️
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "#F4F6FF",
              letterSpacing: "-0.02em",
            }}
          >
            TripSplits
          </div>
        </div>
        {/* Headline */}
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            bottom: 70,
            color: "#F4F6FF",
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Trip money, clear
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Split trips with friends.
            <br />
            Settle by UPI&nbsp;QR.
          </div>
        </div>
      </div>

      {/* Form card */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          margin: "0 16px 32px",
          padding: 22,
          borderRadius: 32,
          background: "var(--g-card-glass)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-inset-top), var(--shadow-2)",
          backdropFilter: "blur(24px) saturate(140%)",
        }}
      >
        {/* Segmented */}
        <div style={{ marginBottom: 18 }}>
          <div className="segmented">
            <button
              className={`segmentedBtn ${isLogin ? "active" : ""}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`segmentedBtn ${!isLogin ? "active" : ""}`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!isLogin && (
            <div className="field">
              <label className="fieldLabel">Name</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--fg-3)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <User size={16} strokeWidth={1.6} />
                </span>
                <input
                  className="fieldInput"
                  style={{ paddingLeft: 42 }}
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label className="fieldLabel">Email</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--fg-3)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Mail size={16} strokeWidth={1.6} />
              </span>
              <input
                className="fieldInput"
                style={{ paddingLeft: 42 }}
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="fieldLabel">Password</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--fg-3)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Lock size={16} strokeWidth={1.6} />
              </span>
              <input
                className="fieldInput"
                style={{ paddingLeft: 42 }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            style={{ width: "100%", marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <ArrowRight size={16} strokeWidth={2} />
            )}
            {isLogin ? "Login to your trips" : "Create account"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            color: "var(--fg-2)",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.55,
          }}
        >
          {isLogin ? "New to TripSplits?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(isLogin ? "signup" : "login")}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--accent-blue)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
            type="button"
          >
            {isLogin ? "Create an account →" : "Login →"}
          </button>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          color: "var(--fg-3)",
          fontSize: 11,
          fontWeight: 500,
          padding: "0 32px 100px",
          lineHeight: 1.5,
        }}
      >
        By continuing you agree to our Terms · Privacy Policy.
        <br />
        UPI QR payments use any UPI app — GPay, PhonePe, Paytm, BHIM.
      </div>
    </div>
  );
}
