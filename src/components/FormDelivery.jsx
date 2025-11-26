import React, { useState, useRef, useEffect } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  Timestamp,
  setDoc,
} from "firebase/firestore";

// Secondary (isolated) auth just for OTP verification
import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";

import "./FormDelivery.css";
import { Toaster, toast } from "react-hot-toast";

const MAX_ORDERS_PER_WEEK = 5;   // (kept) max number of orders/week
const MAX_ITEMS_PER_ORDER = 5;   // (kept) max items per single order
const WEEKLY_ITEM_LIMIT = 5;     // NEW: total items allowed per week (across orders)

/* ======================= Small helpers ======================= */

// Make a single-line address for easy Google Sheets columns
function fullAddress({ address, city, state, pincode }) {
  const parts = [address, city, state, pincode].filter(Boolean);
  return parts.join(", ");
}

// Sunday start of week
function getStartOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Parse "₹12,345" => 12345
function parsePrice(v) {
  return Number(String(v).replace(/[₹,\s]/g, "")) || 0;
}

const DeliveryAddressForm = ({ onNext }) => {
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [orderPopup, setOrderPopup] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false); // avoid double-clicks

  // OTP infra (secondary app/auth + recaptcha + verificationId)
  const otpAppRef = useRef(null);
  const otpAuthRef = useRef(null);
  const recaptchaRef = useRef(null);
  const verificationIdRef = useRef(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientMobile: "",
    recipientEmail: "",
    recipientCompany: "",
    pincode: "",
    state: "",
    city: "",
    address: "",

    billingName: "",
    billingEmail: "",
    billingCompany: "",
    billingPincode: "",
    billingState: "",
    billingCity: "",
    billingAddress: "",
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setLoadingCart(true);
      try {
        if (!user) {
          setCartQuantity(0);
          return;
        }
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        const items = cartSnap.exists() ? cartSnap.data().items || [] : [];
        const qty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        setCartQuantity(qty);
      } catch (e) {
        console.error("Cart load error:", e);
        setCartQuantity(0);
      } finally {
        setLoadingCart(false);
      }
    });
    return () => unsub && unsub();
  }, []);

  const overItemLimit = cartQuantity > MAX_ITEMS_PER_ORDER;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- OTP: use a SECONDARY auth so main session stays intact
  const ensureOtpAuth = () => {
    if (!otpAppRef.current) {
      // create a secondary app using the same config/options as the main one
      otpAppRef.current = initializeApp(auth.app.options, "otpApp");
      otpAuthRef.current = getAuth(otpAppRef.current);
    }
    return otpAuthRef.current;
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();

    if (loadingCart) return toast.error("Checking your cart… please try again.");
    if (cartQuantity === 0) return toast.error("Your cart is empty.");
    if (overItemLimit)
      return toast.error(
        `You can order a maximum of ${MAX_ITEMS_PER_ORDER} items per order. Please reduce items.`
      );
    if (!formData.recipientMobile || formData.recipientMobile.trim().length < 10)
      return toast.error("Please enter a valid recipient phone number.");

    try {
      const user = auth.currentUser;
      if (!user) return toast.error("Please login first.");

      const otpAuth = ensureOtpAuth();

      // Make (or reuse) invisible reCAPTCHA on the SECONDARY auth
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(otpAuth, "recaptcha-container", {
          size: "invisible",
        });
      }

      const phone = "+91" + formData.recipientMobile.trim();
      const provider = new PhoneAuthProvider(otpAuth);
      const verificationId = await provider.verifyPhoneNumber(phone, recaptchaRef.current);

      verificationIdRef.current = verificationId;
      setShowOTPModal(true);
      toast.success("OTP sent to recipient number.");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to send OTP.");
    }
  };

  // --- OTP: verify code on SECONDARY auth without changing main user
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    try {
      const verificationId = verificationIdRef.current;
      if (!verificationId) return toast.error("OTP session expired. Please resend OTP.");

      const otpAuth = ensureOtpAuth();
      const cred = PhoneAuthProvider.credential(verificationId, otp);

      // Sign in on the SECONDARY auth only (this validates the code)
      await signInWithCredential(otpAuth, cred);
      // Immediately clear that temporary session
      await signOut(otpAuth);

      setVerified(true);
      setShowOTPModal(false);
      toast.success("Recipient phone verified!");
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handlePlaceOrder = async () => {
    if (isPlacing) return; // avoid double clicks
    setIsPlacing(true);

    let orderCompleted = false;
    const step = (name) => (msg, err) => {
      console.error(`[Order:${name}]`, err || msg);
      if (orderCompleted) return;
      toast.error(`${msg}${err?.code ? ` (${err.code})` : ""}`);
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please login and verify the recipient phone first.");
        return;
      }

      // 1) 7-day block check (kept as-is)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const lastBlockDate = userSnap.data().lastBlockDate?.toDate?.();
        if (lastBlockDate) {
          const now = new Date();
          const diffDays = Math.floor((now - lastBlockDate) / (1000 * 60 * 60 * 24));
          if (diffDays < 7) {
            toast.error(`You placed an order with 5 items recently. Please wait ${7 - diffDays} day(s).`);
            return;
          }
        }
      }

      // 2) Save / update delivery address (kept)
      try {
        const deliveryRef = doc(db, "deliveryAddresses", user.uid);
        const snap = await getDoc(deliveryRef);
        const dataToSave = {
          uid: user.uid,
          ...formData,
          sameAsBilling,
          addressFilled: true,
          updatedAt: serverTimestamp(),
          ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
        };
        if (snap.exists()) await updateDoc(deliveryRef, dataToSave);
        else await setDoc(deliveryRef, dataToSave);
      } catch (err) {
        return step("address")("Could not save delivery address", err);
      }

      // 3) Load cart (kept)
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);
      const cartItems = cartSnap.exists() ? cartSnap.data().items || [] : [];
      if (!cartItems.length) {
        toast.error("Your cart is empty.");
        return;
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + parsePrice(item.price) * (item.quantity || 1),
        0
      );
      const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      // Keep per-order cap
      if (totalQuantity > MAX_ITEMS_PER_ORDER) {
        toast.error(
          `Maximum ${MAX_ITEMS_PER_ORDER} items allowed per order. Please remove ${
            totalQuantity - MAX_ITEMS_PER_ORDER
          } item(s).`
        );
        return;
      }

      // 4) Weekly checks (kept order-count limit + NEW weekly items cap)
      const weekStart = getStartOfWeek();
      const ordersRef = collection(db, "orders", user.uid, "userOrders");
      let weeklyOrdersSnap;
      try {
        const qWeekly = query(ordersRef, where("createdAt", ">=", Timestamp.fromDate(weekStart)));
        weeklyOrdersSnap = await getDocs(qWeekly);
      } catch (err) {
        return step("weekly-limit")("Could not check weekly order limit", err);
      }

      // (kept) weekly order count limit
      if (weeklyOrdersSnap.size >= MAX_ORDERS_PER_WEEK) {
        toast.error(`Weekly order limit reached (${MAX_ORDERS_PER_WEEK}/week).`);
        return;
      }

      // NEW: weekly items total limit
      const itemsUsedThisWeek = weeklyOrdersSnap.docs.reduce((sum, d) => {
        const q = d.data()?.totalQuantity || 0;
        return sum + Number(q);
      }, 0);

      const itemsRemaining = Math.max(0, WEEKLY_ITEM_LIMIT - itemsUsedThisWeek);

      if (itemsRemaining <= 0) {
        toast.error(`Weekly limit reached: ${WEEKLY_ITEM_LIMIT} item(s) per week.`);
        return;
      }

      if (totalQuantity > itemsRemaining) {
        const needToRemove = totalQuantity - itemsRemaining;
        toast.error(
          `You can only add ${itemsRemaining} more item(s) this week. Please remove ${needToRemove} item(s) from your cart.`
        );
        return;
      }

      // 5) Send to Google Sheet (kept)
      try {
        const profile = userSnap?.exists() ? userSnap.data() : {};

        const signupName =
          user?.displayName ||
          profile?.name ||
          profile?.fullName ||
          "";

        // Prefer precise E.164; also derive a 10-digit Indian mobile if available
        const signupMobileE164 =
          user?.phoneNumber ||
          profile?.phone ||
          profile?.mobile ||
          "";
        const signupMobile =
          signupMobileE164.startsWith("+91") && signupMobileE164.length > 3
            ? signupMobileE164.slice(3)
            : signupMobileE164;

        const signupEmail =
          user?.email ||
          profile?.email ||
          "";

        // Flattened addresses for easy columns in Sheets
        const shippingAddress = fullAddress({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        });

        const billingAddress = fullAddress({
          address: formData.billingAddress,
          city: formData.billingCity,
          state: formData.billingState,
          pincode: formData.billingPincode,
        });

        const payload = {
          // === Order metadata ===
          uid: user.uid,
          cartItems,
          totalAmount,
          totalQuantity,
          sameAsBilling,

          // === Recipient (OTP-verified) ===
          recipientName: formData.recipientName,
          recipientMobile: formData.recipientMobile,
          recipientEmail: formData.recipientEmail,
          recipientCompany: formData.recipientCompany,

          // === Addresses (raw + flattened) ===
          shipping: {
            state: formData.state,
            city: formData.city,
            pincode: formData.pincode,
            address: formData.address,
            full: shippingAddress,
          },
          billing: {
            name: formData.billingName,
            email: formData.billingEmail,
            company: formData.billingCompany,
            state: formData.billingState,
            city: formData.billingCity,
            pincode: formData.billingPincode,
            address: formData.billingAddress,
            full: billingAddress,
          },

          // === Signup user (account holder)
          signupUser: {
            name: signupName,
            mobile: signupMobile,        // usually last 10 for India
            mobileE164: signupMobileE164, // exact E.164 (e.g. +91XXXXXXXXXX)
            email: signupEmail,
          },

          // Optional: let Apps Script route/branch if needed
          intent: "order_with_user",
        };

        const res = await fetch(
          "https://script.google.com/macros/s/AKfycby9rb2qpdG9lo5y9vcuPs6so84XdCDhYSKrWkX927MnUj-mtiKTqlFmHbpXCFveJO3C/exec",
          {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
          }
        );

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {}
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || `Apps Script HTTP ${res.status}`);
        }
      } catch (err) {
        return step("sheet")("Failed to submit order to sheet", err);
      }

      // 6) Create Firestore order (kept)
      try {
        await runTransaction(db, async (transaction) => {
          const newOrderRef = doc(collection(db, "orders", user.uid, "userOrders"));
          transaction.set(newOrderRef, {
            uid: user.uid,
            items: cartItems,
            totalAmount,
            totalQuantity,
            address: formData,
            sameAsBilling,
            status: "Placed",
            createdAt: Timestamp.now(),
          });
        });
      } catch (err) {
        return step("create-order")("Failed to create Firestore order", err);
      }

      // 7) Clear cart (kept)
      try {
        const cartRef = doc(db, "carts", user.uid);
        if (!cartSnap.exists()) {
          await setDoc(cartRef, { items: [] });
        } else {
          await updateDoc(cartRef, { items: [] });
        }
      } catch (err) {
        return step("clear-cart")("Order created but failed to clear cart", err);
      }

      // 8) Apply 7-day limit if exactly 5 items (kept)
      if (totalQuantity === MAX_ITEMS_PER_ORDER) {
        try {
          await updateDoc(doc(db, "users", user.uid), { lastBlockDate: Timestamp.now() });
        } catch (err) {
          step("limit-flag")("Order placed but failed to update user limit flag", err);
        }
      }

      orderCompleted = true;
      window.location.href = "/order-success";
      return;
    } catch (err) {
      console.error("[Order:unknown]", err);
      toast.error(`Order failed. ${err?.message || "Unknown error."}`);
    } finally {
      if (!orderCompleted) setIsPlacing(false);
    }
  };

  const handleSameAsBilling = (checked) => {
    setSameAsBilling(checked);
    setFormData((prev) => ({
      ...prev,
      billingName: checked ? prev.recipientName : "",
      billingEmail: checked ? prev.recipientEmail : "",
      billingCompany: checked ? prev.recipientCompany : "",
      billingState: checked ? prev.state : "",
      billingCity: checked ? prev.city : "",
      billingPincode: checked ? prev.pincode : "",
      billingAddress: checked ? prev.address : "",
    }));
  };

  const handleClosePopup = () => {
    setOrderPopup(false);
    window.location.reload();
  };

  return (
    <div className="delivery-container">
      <Toaster position="top-right" />

      <h3 className="delivery-title">Shipping Address</h3>

      <div className="cart-limit-banner" style={{ marginBottom: 12 }}>
        <strong>Items in cart:</strong>{" "}
        {loadingCart ? "Loading…" : `${cartQuantity} / ${MAX_ITEMS_PER_ORDER}`}
        {overItemLimit && (
          <span style={{ marginLeft: 8 }}>
            — Please remove extra item(s) to continue.
          </span>
        )}
      </div>

      <form className="delivery-grid" onSubmit={handleSendOTP}>
        <div className="delivery-field">
          <label>Recipient Name*</label>
          <input name="recipientName" className="delivery-input" onChange={handleChange} required />
        </div>

        <div className="delivery-field">
          <label>Recipient Mobile Number*</label>
          <input
            type="tel"
            name="recipientMobile"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        <div className="delivery-field">
          <label>Recipient Email*</label>
          <input
            type="email"
            name="recipientEmail"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        <div className="delivery-field">
          <label>Recipient Company Name</label>
          <input name="recipientCompany" className="delivery-input" onChange={handleChange} />
        </div>

        <div className="delivery-field">
          <label>State*</label>
          <input name="state" className="delivery-input" onChange={handleChange} required />
        </div>

        <div className="delivery-field">
          <label>City*</label>
          <input name="city" className="delivery-input" onChange={handleChange} required />
        </div>

        <div className="delivery-field">
          <label>Address*</label>
          <input name="address" className="delivery-input" onChange={handleChange} required />
        </div>

        <div className="delivery-field">
          <label>Pincode*</label>
          <input name="pincode" className="delivery-input" onChange={handleChange} required />
        </div>

        <div className="delivery-field checkbox-field" style={{ gridColumn: "1 / -1" }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => handleSameAsBilling(e.target.checked)}
              className="checkbox-input"
            />
            Is your shipping address same as that of billing address
          </label>
        </div>

        {!sameAsBilling && (
          <div className="billing-section" style={{ gridColumn: "1 / -1" }}>
            <h4 className="billing-title">Billing Address</h4>

            <div className="delivery-grid">
              <div className="delivery-field">
                <label>Name*</label>
                <input name="billingName" className="delivery-input" onChange={handleChange} required />
              </div>

              <div className="delivery-field">
                <label>Email*</label>
                <input type="email" name="billingEmail" className="delivery-input" onChange={handleChange} required />
              </div>

              <div className="delivery-field">
                <label>State*</label>
                <input name="billingState" className="delivery-input" onChange={handleChange} required />
              </div>

              <div className="delivery-field">
                <label>City*</label>
                <input name="billingCity" className="delivery-input" onChange={handleChange} required />
              </div>

              <div className="delivery-field">
                <label>Address*</label>
                <input name="billingAddress" className="delivery-input" onChange={handleChange} required />
              </div>

              <div className="delivery-field">
                <label>Pincode*</label>
                <input name="billingPincode" className="delivery-input" onChange={handleChange} required />
              </div>
            </div>
          </div>
        )}

        <div className="delivery-button-wrapper">
          {!verified ? (
            <button
              type="submit"
              className="send-otp-btn"
              disabled={overItemLimit || loadingCart}
              title={overItemLimit ? `Reduce to ${MAX_ITEMS_PER_ORDER} items or less to continue` : undefined}
            >
              Verify Recipient
            </button>
          ) : (
            <>
              <button disabled className="verified-btn" style={{ backgroundColor: "green" }}>
                Verified ✅
              </button>

              <button
                type="button"
                className="place-order-btn"
                style={{ marginLeft: "10px" }}
                onClick={handlePlaceOrder}
                disabled={overItemLimit || isPlacing}
                aria-busy={isPlacing}
                title={
                  overItemLimit
                    ? `Reduce to ${MAX_ITEMS_PER_ORDER} items or less to continue`
                    : undefined
                }
              >
                {isPlacing ? "Placing…" : "Place Order"}
              </button>
            </>
          )}
        </div>
      </form>

      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-content">
            <h2>Verify Recipient Phone</h2>
            <p>Enter the 6-digit code sent to the recipient’s mobile number</p>

            <form onSubmit={handleOTPSubmit} className="otp-form">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="otp-input-box"
                placeholder="Enter OTP"
                required
              />
              <button type="submit" className="verify-btn">
                Verify
              </button>
            </form>

            <p className="resend-text" onClick={() => handleSendOTP()}>
              Didn’t receive code? <span>Resend</span>
            </p>
          </div>
        </div>
      )}

      {orderPopup && (
        <div className="order-popup">
          <div className="order-popup-content">
            <h3>🎉 Order Placed Successfully!</h3>
            <p>Your order has been successfully placed. Our team will contact you within 24–48 hours.</p>
            <button onClick={handleClosePopup}>OK</button>
          </div>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default DeliveryAddressForm;
