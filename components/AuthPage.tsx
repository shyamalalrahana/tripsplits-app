"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState<string | null>(null);
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

  const fieldStyle = (field: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    background: "var(--glass)",
    color: "var(--fg-1)",
    border: `1px solid ${focusField === field ? "var(--accent-blue)" : "var(--line)"}`,
    borderRadius: 18,
    transition: "border-color 200ms, box-shadow 200ms",
    boxShadow: focusField === field ? "0 0 0 4px rgba(91,140,255,.16)" : "none",
  });

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Cover band */}
      <div style={{ position: "relative", height: 300, overflow: "hidden", marginBottom: -56 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #1A2240 0%, #2A6CFF 40%, #B57BFF 70%, #FF6BC9 100%)",
          }}
        >
          {/* Sun */}
          <div
            style={{
              position: "absolute",
              top: 38,
              right: 50,
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "radial-gradient(circle, #FFC55B 0%, #FF8A5B 60%, transparent 75%)",
              filter: "blur(2px)",
            }}
          />
        </div>
        {/* Fade overlay */}
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
            top: 20,
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
              fontSize: 18,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 20px -4px rgba(91,140,255,.45)",
            }}
          >
            ✈️
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "#F4F6FF",
              letterSpacing: "-0.02em",
            }}
          >
            TripSplits
          </span>
        </div>
        {/* Headline */}
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            bottom: 72,
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
              color: "rgba(244,246,255,.8)",
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
              color: "#F4F6FF",
            }}
          >
            Split trips with friends.
            <br />
            Settle by UPI&nbsp;QR.
          </div>
        </div>
      </div>

      {/* Form card — lifts over cover with negative margin */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 16px 48px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--g-card-glass)",
            border: "1px solid var(--line)",
            borderRadius: 32,
            padding: 22,
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 60px -20px rgba(0,0,0,.55)",
          }}
        >
          {/* Segmented login/signup switcher */}
          <div style={{ marginBottom: 18 }}>
            <div className="segmented">
              <button
                type="button"
                className={`segmentedBtn ${isLogin ? "active" : ""}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`segmentedBtn ${!isLogin ? "active" : ""}`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!isLogin && (
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--fg-3)",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                    paddingLeft: 4,
                  }}
                >
                  Name
                </div>
                <div style={fieldStyle("name")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-3)", display: "block", flexShrink: 0 }}>
                    <circle cx="9" cy="8" r="3.2" />
                    <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusField("name")}
                    onBlur={() => setFocusField(null)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: 0,
                      outline: 0,
                      padding: 0,
                      color: "var(--fg-1)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  paddingLeft: 4,
                }}
              >
                Email
              </div>
              <div style={fieldStyle("email")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-3)", display: "block", flexShrink: 0 }}>
                  <circle cx="6" cy="12" r="2.4" />
                  <circle cx="18" cy="6" r="2.4" />
                  <circle cx="18" cy="18" r="2.4" />
                  <path d="M8 11l8-4M8 13l8 4" />
                </svg>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  required
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    padding: 0,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--fg-3)",
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  paddingLeft: 4,
                }}
              >
                Password
              </div>
              <div style={fieldStyle("password")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-3)", display: "block", flexShrink: 0 }}>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  required
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: 0,
                    outline: 0,
                    padding: 0,
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 16,
                  background: "var(--tint-orange)",
                  color: "var(--accent-orange)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="submit"
              className="btn btnPrimary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
              {isLogin ? "Login to your trips" : "Create account"}
            </button>
          </div>

          {/* Or divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "18px 0 16px",
            }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span
              style={{
                color: "var(--fg-3)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                fontFamily: "var(--font-display)",
              }}
            >
              Or
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>

          {/* Switch mode link */}
          <div
            style={{
              textAlign: "center",
              color: "var(--fg-2)",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.55,
            }}
          >
            {isLogin ? "New to TripSplits?" : "Already have an account?"}{" "}
            <button
              type="button"
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
            >
              {isLogin ? "Create an account →" : "Login →"}
            </button>
          </div>
        </form>
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
