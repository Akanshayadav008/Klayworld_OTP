// src/components/SignupWithPhoneOTP.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query as fsQuery,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function SignupWithPhoneOTP() {
  const navigate = useNavigate();

  // ----- form states -----
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOtp, setShowOtp] = useState(false); // 👁️ toggle visibility

  const [captchaRootId] = useState(
    () => `recaptcha-root-${Math.random().toString(36).slice(2)}`
  );
  const hasWrittenRef = useRef(false);
  const recaptchaRef = useRef(null);
  const widgetIdRef = useRef(null);
  const childIdRef = useRef(null);
  const creatingRef = useRef(false);

  // Gate redirect like login (not strictly needed once we navigate directly)
  const readyToRedirectRef = useRef(false);
  // ✅ NEW: track if we navigated, so cleanup doesn't sign out immediately
  const didNavigateRef = useRef(false);

  // ---------- VALIDATION ----------
  const normalizePhone = (phone) => {
    if (!phone) return phone;
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
    if (/^0\d{10}$/.test(cleaned)) return "+91" + cleaned.slice(1);
    if (/^\d{10}$/.test(cleaned)) return "+91" + cleaned;
    if (/^91\d{10}$/.test(cleaned)) return "+" + cleaned;
    return cleaned;
  };

  const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneValid = (v) => /^\+[1-9]\d{7,14}$/.test(normalizePhone(v));
  const passwordValid = (v) => typeof v === "string" && v.length >= 8;

  const validateField = (name, value, _form = form) => {
    switch (name) {
      case "firstName":
        return value.trim() ? "" : "First name is required.";
      case "lastName":
        return value.trim() ? "" : "Last name is required.";
      case "email":
        if (!value.trim()) return "Email is required.";
        return emailValid(value) ? "" : "Enter a valid email.";
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        return phoneValid(value) ? "" : "Enter a valid phone number.";
      case "password":
        if (!value) return "Password is required.";
        return passwordValid(value) ? "" : "Minimum 8 characters.";
      default:
        return "";
    }
  };

  const validateForm = (f = form) => {
    const errs = {};
    Object.keys(f).forEach((field) => {
      const e = validateField(field, f[field], f);
      if (e) errs[field] = e;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFormValid = () => {
    const f = form;
    return (
      f.firstName.trim() &&
      f.lastName.trim() &&
      emailValid(f.email.trim()) &&
      phoneValid(f.phone.trim()) &&
      passwordValid(f.password)
    );
  };

  // ---------- FIREBASE HELPERS ----------
  const checkEmailExists = async (email) => {
    if (!emailValid(email)) return false;
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  };

  const checkPhoneExists = async (normalizedPhone) => {
    if (!normalizedPhone) return false;
    const q = fsQuery(
      collection(db, "users"),
      where("phone", "==", normalizedPhone),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const createFreshChild = () => {
    const root = document.getElementById(captchaRootId);
    if (!root) throw new Error(`reCAPTCHA root #${captchaRootId} not found`);
    if (childIdRef.current) {
      const prev = document.getElementById(childIdRef.current);
      if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      childIdRef.current = null;
    }
    const newChildId = `recaptcha-child-${Math.random().toString(36).slice(2)}`;
    const child = document.createElement("div");
    child.id = newChildId;
    root.appendChild(child);
    childIdRef.current = newChildId;
    return newChildId;
  };

  const setupRecaptcha = async () => {
    if (recaptchaRef.current && widgetIdRef.current != null)
      return recaptchaRef.current;
    if (creatingRef.current) return recaptchaRef.current;
    creatingRef.current = true;
    try {
      const childId = createFreshChild();
      const verifier = new RecaptchaVerifier(auth, childId, { size: "invisible" });
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

  useEffect(() => {
    auth?.useDeviceLanguage?.();

    // Keep observer (like login). We also navigate directly later.
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && readyToRedirectRef.current) {
        navigate("/", { replace: true });
      }
    });

    return () => {
      unsub();
      teardownRecaptcha();
      // ❗ If we just navigated after success, don't sign out on unmount.
      if (!didNavigateRef.current && auth?.currentUser) {
        signOut(auth).catch(() => {});
      }
    };
  }, [navigate]);

  // ---------- FORM HANDLERS ----------
  const showError = (f) =>
    !!errors[f] && (touched[f] || submitted) ? errors[f] : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: value };
      setErrors((er) => ({ ...er, [name]: validateField(name, value, next) }));
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((er) => ({ ...er, [name]: validateField(name, form[name], form) }));
  };

  const sendOtp = async () => {
    setSubmitted(true);
    setMessage("");
    if (!validateForm()) return;
    const normalized = normalizePhone(form.phone);
    setLoading(true);
    try {
      const [emailExists, phoneExists] = await Promise.all([
        checkEmailExists(form.email.trim()).catch(() => false),
        checkPhoneExists(normalized).catch(() => false),
      ]);

      if (emailExists || phoneExists) {
        const nextErrors = { ...errors };
        if (emailExists) nextErrors.email = "Email already exists. Try logging in.";
        if (phoneExists)
          nextErrors.phone = "Phone number already exists. Try logging in.";
        setErrors(nextErrors);
        setTouched({ email: true, phone: true });
        setLoading(false);

        if (emailExists && phoneExists)
          setMessage("Both email and phone number already exist. Try logging in.");
        else if (emailExists) setMessage("Email already exists. Try logging in.");
        else if (phoneExists)
          setMessage("Phone number already exists. Try logging in.");
        return;
      }

      const appVerifier = await setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, normalized, appVerifier);
      setConfirmationResult(result);
      setMessage("✓ OTP sent successfully! Check your SMS.");
    } catch (error) {
      setMessage("Failed to send OTP. " + error.message);
      teardownRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // place this helper above verifyOtp in your component
  const safeLinkEmail = async (user, email, password) => {
    if (!email || !password) return { linked: false, error: null, code: null };
    try {
      const emailCred = EmailAuthProvider.credential(email.trim(), password);
      const linkResult = await linkWithCredential(user, emailCred);
      console.log("safeLinkEmail: linked email credential:", linkResult);
      return { linked: true, error: null, code: null };
    } catch (linkErr) {
      console.error("safeLinkEmail: linkWithCredential error:", linkErr);
      return { linked: false, error: linkErr, code: linkErr?.code || null };
    }
  };

  // REPLACE your old verifyOtp with this one (keeps all your logic)
  const verifyOtp = async () => {
    setMessage("");
    if (!otp.trim()) return setMessage("Enter the 6-digit code.");
    if (!confirmationResult) return setMessage("No OTP session. Request OTP again.");
    if (loading) return;
    setLoading(true);

    try {
      // 1) Confirm OTP
      const cred = await confirmationResult.confirm(otp.trim());
      const user = cred.user;
      console.log("verifyOtp: confirmed", { uid: user?.uid, phone: user?.phoneNumber });

      // 2) (non-fatal) update display name
      try {
        await updateProfile(user, {
          displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        });
      } catch (e) {
        console.warn("updateProfile non-fatal:", e);
      }

      // 3) (non-blocking) link email/password if provided
      if (form.email && form.password) {
        const linkInfo = await safeLinkEmail(user, form.email, form.password);
        if (!linkInfo.linked) {
          if (linkInfo.code === "auth/email-already-in-use") {
            setMessage((m) => (m ? m + "\n" : "") + "Email already in use. Account created with phone only.");
          } else if (linkInfo.code === "auth/weak-password") {
            setMessage((m) => (m ? m + "\n" : "") + "Weak password. Email linking failed.");
          } else if (linkInfo.error) {
            setMessage((m) => (m ? m + "\n" : "") + `Email linking failed: ${linkInfo.error?.message || linkInfo.code}`);
          }
        } else {
          setMessage((m) => (m ? m + "\n" : "") + "✓ Email linked successfully.");
        }
      }

      // 4) Write user profile to Firestore
      try {
        if (!user || !user.uid) throw new Error("No user UID available.");
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email?.trim() || null,
            phone: user.phoneNumber || normalizePhone(form.phone),
            company: form.company?.trim() || null,
            phoneVerified: true,
            createdAt: serverTimestamp(),
            weeklyOrderCount: 0,  // 🆕
            lastOrderReset: serverTimestamp(), // 🆕
          },
          { merge: true }
        );

        console.log("verifyOtp: setDoc succeeded");
        hasWrittenRef.current = true;
      } catch (dbErr) {
        console.error("verifyOtp: Firestore write failed:", dbErr);
        setMessage(`Could not save profile: ${dbErr?.code || ""} ${dbErr?.message || dbErr}`);
        setLoading(false);
        return;
      }

      // ----------------------------
      // Additional writes: deliveryAddresses and cart
      // ----------------------------
      try {
        const deliveryPayload = {
          uid: user.uid,
          recipientName: "",
          recipientMobile: "",
          recipientEmail: "",
          recipientCompany: "",
          phoneVerified: true,
          pincode: "",
          state: "",
          city: "",
          createdAt: serverTimestamp(),
          billingName: "",
          billingMobile: "",
          billingEmail: "",
          billingCompany: "",
          billingPincode: "",
          billingState: "",
          billingCity: "",
        };
        await setDoc(doc(db, "deliveryAddresses", user.uid), deliveryPayload, { merge: true });
        console.log("verifyOtp: deliveryAddresses doc written:", user.uid);
      } catch (delErr) {
        console.error("verifyOtp: failed to write deliveryAddresses:", delErr);
      }

      try {
        const cartPayload = {
          uid: user.uid,
          items: "",
        };
        await setDoc(doc(db, "carts", user.uid), cartPayload, { merge: true });
        console.log("verifyOtp: carts doc written:", user.uid);
      } catch (delErr) {
        console.error("verifyOtp: failed to write carts:", delErr);
      }

      // 5) Create an empty cart (to be filled later when user books a sample)
      try {
        const emptyCartPayload = {
          uid: user.uid,
          items: [], // intentionally empty
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        };
        await setDoc(doc(db, "carts", user.uid), emptyCartPayload, { merge: true });
        console.log("verifyOtp: empty cart initialized:", user.uid);
      } catch (cartErr) {
        console.error("verifyOtp: failed to initialize empty cart:", cartErr);
      }

      // 5) Create an empty cart (duplicate from your code, kept as-is)
      try {
        const emptyCartPayload = {
          uid: user.uid,
          items: [], // intentionally empty
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        };
        await setDoc(doc(db, "carts", user.uid), emptyCartPayload, { merge: true });
        console.log("verifyOtp: empty cart initialized:", user.uid);
      } catch (cartErr) {
        console.error("verifyOtp: failed to initialize empty cart:", cartErr);
      }

      try {
        const ordersPayload = {
          uid: user.uid,
          items: [], // always an array
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        };
        await setDoc(doc(db, "orders", user.uid), ordersPayload, { merge: true });
        console.log("verifyOtp: orders doc written:", user.uid);
      } catch (err) {
        console.error("verifyOtp: failed to write orders:", err);
      }

      // ✅ behave like login: finish and go home immediately
      readyToRedirectRef.current = true;      // for observer (harmless)
      setConfirmationResult(null);
      setOtp("");

      // IMPORTANT: avoid sign-out in cleanup after navigating
      didNavigateRef.current = true;
      navigate("/", { replace: true });

    } catch (e) {
      console.error("verifyOtp: verification failed:", e);
      if (e?.code === "auth/invalid-verification-code") setMessage("Invalid code. Please check and try again.");
      else if (e?.code === "auth/code-expired") setMessage("Code expired. Please request a new OTP.");
      else setMessage("Verification failed. " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div
      style={{
        background: "#f9f4ec",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "poppins, sans-serif",
        height: "100vh",
      }}
    >
      <div
        style={{
          background: "#fffaf2",
          border: "1px solid #bfbab2",
          borderRadius: "8px",
          padding: "2rem 2rem 1.5rem",
          width: "100%",
          maxWidth: "600px",
          marginTop: "10px",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        {!confirmationResult ? (
          <>
            <h2
              style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#1d1d1d",
                marginBottom: "1.7rem",
              }}
            >
              Sign up with Klay AI
            </h2>

            {/* Name Fields */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <InputField
                label="First Name*"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("firstName")}
              />
              <InputField
                label="Last Name*"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("lastName")}
              />
            </div>

            {/* Email + Phone */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <InputField
                label="Email*"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("email")}
              />
              <InputField
                label="Phone Number*"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError("phone")}
              />
            </div>

            <InputField
              label="Password*"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={showError("password")}
            />
            <InputField
              label="Company Name"
              name="company"
              value={form.company}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <div id={captchaRootId} />

            <button
              onClick={sendOtp}
              disabled={loading || !isFormValid()}
              style={{
                width: "100%",
                marginTop: "1.5rem",
                background: "#333333",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "0.9rem",
                fontWeight: 500,
                cursor: loading || !isFormValid() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.8rem",
              }}
            >
              Already have an account?{" "}
              <a href="/login" style={{ fontWeight: 600, color: "#333333" }}>
                Login
              </a>
            </p>
          </>
        ) : (
          <>
            {/* ✅ Verify Code Layout */}
            <div
              style={{
                background: "#fffaf2",
                borderRadius: "8px",
                padding: "2rem",
                width: "100%",
                maxWidth: "400px",
                textAlign: "center",
                margin: "0 auto",
              }}
            >
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  color: "#1d1d1d",
                  marginBottom: "1.5rem",
                }}
              >
                Verify Code
              </h2>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#333",
                  marginBottom: "1.5rem",
                }}
              >
                OTP sent to <strong>{form.phone}</strong>
              </p>

              {/* OTP Input with eye toggle */}
              <div style={{ position: "relative", marginBottom: "1rem" }}>
                <input
                  type={showOtp ? "text" : "password"}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter Code"
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    fontSize: "1rem",
                    border: "1px solid #c6c1b8",
                    borderRadius: "6px",
                    background: "none",
                    outline: "none",
                    textAlign: "center",
                    letterSpacing: "3px",
                  }}
                />
                <span
                  onClick={() => setShowOtp(!showOtp)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#555",
                    userSelect: "none",
                  }}
                >
                  {showOtp ? "🙈" : "👁️"}
                </span>
              </div>

              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#555",
                  marginBottom: "1.2rem",
                }}
              >
                Didn’t receive a code?{" "}
                <span
                  style={{ fontWeight: 600, cursor: "pointer", color: "#000" }}
                  onClick={sendOtp}
                >
                  Resend
                </span>
              </p>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  width: "100%",
                  background: "#2f2f2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.9rem",
                  fontWeight: 600,
                  cursor:
                    loading || otp.length !== 6 ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </>
        )}

        {message && (
          <div
            style={{
              marginTop: "1rem",
              background: message.includes("✓") ? "#e8f5e9" : "#fff3e0",
              border: `1px solid ${
                message.includes("✓") ? "#4caf50" : "#ff9800"
              }`,
              padding: "0.8rem",
              borderRadius: "6px",
              color: message.includes("✓") ? "#2e7d32" : "#e65100",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- INPUT FIELD ----------
function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
}) {
  return (
    <div style={{ marginBottom: "0.3rem" }}>
      <label
        style={{
          display: "block",
          marginBottom: "4px",
          fontSize: "0.8rem",
          color: "#333",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{
          width: "100%",
          padding: "0.6rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "0.9rem",
        }}
      />
      {error && (
        <p
          style={{
            color: "#c62828",
            fontSize: "0.75rem",
            marginTop: "-0.8rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
