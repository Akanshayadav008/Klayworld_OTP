// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "./../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg("");

    const userEmail = email.trim().toLowerCase();
    if (!userEmail) return setMsg("Enter your registered email.");

    setLoading(true);
    try {
      // 1) Check Firestore if this email exists in your users collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const snap = await getDocs(q);

      if (snap.empty) {
        setLoading(false);
        return setMsg("❌ No user found with this email.");
      }

      // 2) If present, send Firebase password reset email
      await sendPasswordResetEmail(auth, userEmail);
      setMsg("✅ Password reset link sent. Check your email inbox.");
    } catch (error) {
      const code = error?.code || "";
      if (code === "auth/invalid-email") {
        setMsg("Invalid email address.");
      } else if (code === "auth/network-request-failed") {
        setMsg("Network error. Please try again.");
      } else {
        setMsg("Failed to send reset email. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          padding: "2rem",
          border: "1px solid #bfbab2",
          borderRadius: "8px",
          width: "420px",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem" }}>Reset Password</h2>

        <form onSubmit={handleReset}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#333",
            }}
          >
            Email*
          </label>
          <input
            id="email"
            type="email"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1.2rem",
              borderRadius: "6px",
              border: "1px solid #c6c1b8",
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {msg && (
            <p
              style={{
                color: msg.startsWith("✅") ? "#2e7d32" : "#d32f2f",
                marginBottom: "1rem",
                fontSize: "13px",
              }}
            >
              {msg}
            </p>
          )}

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
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              width: "100%",
              padding: "0.75rem",
              marginTop: "0.8rem",
              background: "#fff",
              color: "#000",
              border: "1px solid #c6c1b8",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
