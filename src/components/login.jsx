import React, { useEffect, useRef, useState } from "react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "./../../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function LoginWithEmailOrPhone() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const confirmationRef = useRef(null);

  const [captchaRootId] = useState(
    () => `login-recaptcha-root-${Math.random().toString(36).slice(2)}`
  );
  const recaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);
  const creatingRef = useRef(false);
  const childIdRef = useRef(null);

  // ---------- HELPERS ----------
  const normalizePhone = (v) => {
    if (!v) return "";
    const cleaned = v.trim().replace(/[\s\-\(\)]/g, "");
    if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
    if (/^\d{10}$/.test(cleaned)) return "+91" + cleaned; // default to +91 for 10-digit inputs
    return cleaned;
  };

  // Non-blocking phone existence check via your API
  // Returns: true (exists), false (doesn't), or null (unknown/error/missing)
  async function checkPhoneExists(normalizedE164) {
    try {
      const endpoint = import.meta.env.VITE_CHECK_PHONE_URL;
      if (!endpoint) return null; // don't block if not configured
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedE164 }),
      });
      const data = await res.json();
      // Expecting { exists: boolean }
      if (typeof data?.exists === "boolean") return data.exists;
      return null;
    } catch {
      return null;
    }
  }

  const createFreshChild = () => {
    const root = document.getElementById(captchaRootId);
    if (!root) return null;

    // clear previous child if any
    if (childIdRef.current) {
      const prev = document.getElementById(childIdRef.current);
      if (prev) prev.remove();
      childIdRef.current = null;
    }

    const childId = `login-recaptcha-child-${Math.random()
      .toString(36)
      .slice(2)}`;
    const child = document.createElement("div");
    child.id = childId;
    root.appendChild(child);
    childIdRef.current = childId;
    return childId;
  };

  const teardownRecaptcha = () => {
    try {
      if (window?.grecaptcha && widgetIdRef.current != null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      recaptchaRef.current?.clear?.();
    } catch {}
    recaptchaRef.current = null;
    widgetIdRef.current = null;
  };

  const setupRecaptcha = async () => {
    if (recaptchaRef.current && widgetIdRef.current != null) {
      return recaptchaRef.current;
    }
    if (creatingRef.current) return recaptchaRef.current;
    creatingRef.current = true;

    try {
      const childId = createFreshChild();
      const { RecaptchaVerifier } = await import("firebase/auth"); // dynamic import avoids SSR/window timing issues
      const verifier = new RecaptchaVerifier(auth, childId, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setMsg("reCAPTCHA expired. Try again.");
          teardownRecaptcha();
        },
      });
      recaptchaRef.current = verifier;
      const wid = await verifier.render();
      widgetIdRef.current = wid;
      creatingRef.current = false;
      return verifier;
    } catch (e) {
      creatingRef.current = false;
      throw e;
    }
  };

  // ---------- EFFECTS ----------
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) window.location.assign("https://ai.klayworld.com");
    });
    return () => {
      teardownRecaptcha();
      unsub();
    };
  }, []);

  useEffect(() => {
    auth?.useDeviceLanguage?.();
  }, []);

  // ---------- EMAIL LOGIN ----------
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!email.trim() || !password) return setMsg("Enter email and password.");
    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email.trim());
      if (methods.length && !methods.includes("password")) {
        return setMsg(
          `This email uses a different sign-in method: ${methods.join(", ")}`
        );
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMsg("✓ Logged in successfully. Redirecting...");
      window.location.assign("https://ai.klayworld.com");
    } catch (err) {
      switch (err?.code) {
        case "auth/invalid-email":
          setMsg("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setMsg("This account has been disabled.");
          break;
        case "auth/user-not-found":
          setMsg("No account found with this email.");
          break;
        case "auth/wrong-password":
          setMsg("Incorrect password. Please try again.");
          break;
        default:
          setMsg("Login failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- PHONE OTP ----------
  const sendOtp = async () => {
    setMsg("");
    const normalized = normalizePhone(phone);
    if (!normalized.startsWith("+"))
      return setMsg("Enter valid phone e.g. +91XXXXXXXXXX");
    setLoading(true);
    try {
      // Optional pre-check; non-blocking if API is missing/unreliable
      const exists = await checkPhoneExists(normalized.trim());
      if (exists === false) {
        setMsg("No account found for this phone. Please sign up first.");
        navigate("/signup", {
          replace: true,
          state: { phone: normalized.trim() },
        });
        return;
      }

      const appVerifier = await setupRecaptcha();
      const { signInWithPhoneNumber } = await import("firebase/auth");
      const confirmation = await signInWithPhoneNumber(
        auth,
        normalized.trim(),
        appVerifier
      );
      confirmationRef.current = confirmation;
      setMsg("OTP sent. Check your phone.");
    } catch (e) {
      setMsg("Failed to send OTP. " + (e?.message || "Please try again."));
      teardownRecaptcha(); // ensure a fresh verifier on next attempt
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg("");
    if (!confirmationRef.current) return setMsg("Send OTP first.");
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) return setMsg("Enter the 6-digit OTP.");
    setLoading(true);
    try {
      await confirmationRef.current.confirm(code);
      setMsg("✓ Logged in successfully. Redirecting...");
      window.location.assign("https://ai.klayworld.com");
    } catch {
      setMsg("Incorrect OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- STYLES ----------
  const inputBox = {
    width: "100%",
    padding: "0.2rem",
    fontSize: "1.1rem",
    letterSpacing: "5px",
    border: "1px solid #c6c1b8",
    borderRadius: "6px",
    textAlign: "center",
    marginBottom: "1rem",
  };

  // ---------- UI (UNCHANGED) ----------
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90vh",
        background: "#fef8ee",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2rem 2.5rem",
          border: "1px solid #bfbab2",
          borderRadius: "8px",
          width: "480px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 600,
            color: "#1d1d1d",
            marginBottom: "1.7rem",
          }}
        >
          Sign in with Klay AI
        </h2>

        {mode === "phone" ? (
          <>
            <div id={captchaRootId} />

            {/* PHONE INPUT */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="phone"
                style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}
              >
                Phone*
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputBox}
              />
            </div>

            {/* OTP INPUT */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="otp"
                style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}
              >
                OTP*
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                style={inputBox}
              />
            </div>

            {msg && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "13px",
                  marginBottom: "1rem",
                }}
              >
                {msg}
              </p>
            )}

            <button
              onClick={!confirmationRef.current ? sendOtp : verifyOtp}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#212121",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "1.2rem",
              }}
            >
              {loading
                ? "Please wait..."
                : !confirmationRef.current
                ? "Send OTP"
                : "Verify & Sign In"}
            </button>

            <div
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#000",
                cursor: "pointer",
              }}
              onClick={() => setMode("email")}
            >
              Via Password
            </div>
          </>
        ) : (
          <form onSubmit={handleEmailLogin}>
            {/* EMAIL INPUT */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="email"
                style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}
              >
                Email*
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputBox}
              />
            </div>

            {/* PASSWORD INPUT */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="password"
                style={{ display: "block", marginBottom: "0.5rem", color: "#333" }}
              >
                Password*
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputBox}
              />
            </div>

            {msg && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "13px",
                  marginBottom: "1rem",
                }}
              >
                {msg}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{ cursor: "pointer", color: "#000" }}
                onClick={() => setMode("phone")}
              >
                Via OTP
              </span>
              <span
                style={{ cursor: "pointer", color: "#000" }}
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#212121",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "14px",
            color: "#333",
            textAlign: "center",
          }}
        >
          Don’t have an account?{" "}
          <span
            style={{ color: "#000", fontWeight: "600", cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
