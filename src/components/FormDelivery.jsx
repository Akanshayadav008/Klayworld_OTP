import React, { useState, useRef } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import "./FormDelivery.css";

const MAX_ORDERS_PER_WEEK = 5;

const DeliveryAddressForm = ({ onNext }) => {
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verified, setVerified] = useState(false);
  const [orderPopup, setOrderPopup] = useState(false);
  const recaptchaRef = useRef(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientMobile: "",
    recipientEmail: "",
    recipientCompany: "",
    pincode: "",
    state: "",
    city: "",
    billingName: "",
    billingMobile: "",
    billingEmail: "",
    billingCompany: "",
    billingPincode: "",
    billingState: "",
    billingCity: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ SEND OTP ------------------------------
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!formData.recipientMobile || formData.recipientMobile.length < 10) {
      alert("Enter valid phone number");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login first");
        return;
      }

      // ✅ check if phone matches signup phone
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const regPhone = userSnap.data().phone;
        const entered = "+91" + formData.recipientMobile.trim();
        const stored = regPhone.startsWith("+91") ? regPhone : "+91" + regPhone;

        if (entered !== stored) {
          alert("Phone does not match your registered number");
          return;
        }
      }

      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      const phone = "+91" + formData.recipientMobile.trim();
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);

      setConfirmationResult(confirmation);
      setShowOTPModal(true);
      alert("OTP Sent");
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  // ✅ VERIFY OTP ------------------------------
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    try {
      await confirmationResult.confirm(otp);
      setVerified(true);
      setShowOTPModal(false);
      alert("Phone Verified!");
    } catch {
      alert("Invalid OTP");
    }
  };

  function getStartOfWeek() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function parsePrice(v) {
    return Number(String(v).replace(/[₹,\s]/g, "")) || 0;
  }

  // ✅ PLACE ORDER ---------------------------
  const handlePlaceOrder = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Verify phone");

      // ✅ Save Address
      const deliveryRef = doc(db, "deliveryAddresses", user.uid);
      const snap = await getDoc(deliveryRef);

      const dataToSave = {
        uid: user.uid,
        ...formData,
        sameAsBilling,
        addressFilled: true,
        updatedAt: serverTimestamp(),
      };

      if (snap.exists()) {
        await updateDoc(deliveryRef, dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await setDoc(deliveryRef, dataToSave);
      }

      // ✅ Get Cart
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);
      const cartItems = cartSnap.exists() ? cartSnap.data().items || [] : [];

      if (!cartItems.length) return alert("Cart is empty");

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + parsePrice(item.price) * (item.quantity || 1),
        0
      );

      // ✅ Weekly order limit
      const weekStart = getStartOfWeek();
      const ordersRef = collection(db, "orders", user.uid, "userOrders");
      const q = query(ordersRef, where("createdAt", ">=", weekStart));
      const weeklyOrdersSnap = await getDocs(q);

      if (weeklyOrdersSnap.size >= MAX_ORDERS_PER_WEEK) {
        return alert(`Limit reached (${MAX_ORDERS_PER_WEEK}/week)`);
      }

      // ✅ Send to Google Sheet
      await fetch(
        "https://script.google.com/macros/s/AKfycbyVJepfizPoJ6luYu4Dwa6TJsAuFAbZNSGn1je2CKwwSQNwtGRfwOF5n5bz_6QEd7lu/exec",
        {
          method: "POST",
          body: JSON.stringify({
            uid: user.uid,
            ...formData,
            sameAsBilling,
            cartItems,
            totalAmount,
          }),
        }
      );

      // ✅ Save order in sub-collection
      await addDoc(collection(db, "orders", user.uid, "userOrders"), {
        uid: user.uid,
        items: cartItems,
        totalAmount,
        address: formData,
        sameAsBilling,
        status: "Placed",
        createdAt: serverTimestamp(),
      });

      // ✅ Clear Cart
      await updateDoc(cartRef, { items: [] });

      setOrderPopup(true);
      onNext && onNext(formData);
    } catch (err) {
      console.log(err);
      alert("Order failed");
    }
  };

  const handleSameAsBilling = (checked) => {
    setSameAsBilling(checked);
    setFormData((prev) => ({
      ...prev,
      billingName: checked ? prev.recipientName : "",
      billingMobile: checked ? prev.recipientMobile : "",
      billingEmail: checked ? prev.recipientEmail : "",
      billingCompany: checked ? prev.recipientCompany : "",
      billingState: checked ? prev.state : "",
      billingCity: checked ? prev.city : "",
      billingPincode: checked ? prev.pincode : "",
    }));
  };

  const handleClosePopup = () => {
    setOrderPopup(false);
    window.location.reload();
  };




  return (
    <div className="delivery-container">
      <h3 className="delivery-title">Shipping Address</h3>

      <form className="delivery-grid" onSubmit={handleSendOTP}>
        {/* Recipient Name */}
        <div className="delivery-field">
          <label>Recipient Name*</label>
          <input
            name="recipientName"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        {/* Mobile */}
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

        {/* Email */}
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

        {/* Company */}
        <div className="delivery-field">
          <label>Recipient Company Name</label>
          <input
            name="recipientCompany"
            className="delivery-input"
            onChange={handleChange}
          />
        </div>

        {/* State */}
        <div className="delivery-field">
          <label>State*</label>
          <input
            name="state"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        {/* City */}
        <div className="delivery-field">
          <label>City*</label>
          <input
            name="city"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        {/* Pincode */}
        <div className="delivery-field">
          <label>Pincode*</label>
          <input
            name="pincode"
            className="delivery-input"
            onChange={handleChange}
            required
          />
        </div>

        {/* Checkbox */}
        <div className="delivery-field checkbox-field" style={{ gridColumn: "1 / -1" }}>
          <label className="checkbox-label">
           <input
  type="checkbox"
  checked={sameAsBilling}
  onChange={(e) => handleSameAsBilling(e.target.checked)}
  className="checkbox-input"
/>

            Shipping address is same as billing address
          </label>
        </div>

        {/* Billing Section */}
        {!sameAsBilling && (
          <div className="billing-section" style={{ gridColumn: "1 / -1" }}>
            <h4 className="billing-title">Billing Address</h4>

            <div className="delivery-grid">
              <div className="delivery-field">
                <label>Name*</label>
                <input
                  name="billingName"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="delivery-field">
                <label>Mobile Number*</label>
                <input
                  type="tel"
                  name="billingMobile"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="delivery-field">
                <label>Email*</label>
                <input
                  type="email"
                  name="billingEmail"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="delivery-field">
                <label>State*</label>
                <input
                  name="billingState"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="delivery-field">
                <label>City*</label>
                <input
                  name="billingCity"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="delivery-field">
                <label>Pincode*</label>
                <input
                  name="billingPincode"
                  className="delivery-input"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="delivery-button-wrapper">
          {!verified ? (
            <button type="submit" className="send-otp-btn">
              Verify User
            </button>
          ) : (
            <>
              <button
                disabled
                className="verified-btn"
                style={{ backgroundColor: "green" }}
              >
                Verified ✅
              </button>
              <button
                type="button"
                className="place-order-btn"
                style={{ marginLeft: "10px" }}
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>
            </>
          )}
        </div>
      </form>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-content">
            <h2>Verify Your Phone</h2>
            <p>Enter the 6-digit code sent to your mobile number</p>

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

            <p className="resend-text" onClick={handleSendOTP}>
              Didn’t receive code? <span>Resend</span>
            </p>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      {orderPopup && (
        <div className="order-popup">
          <div className="order-popup-content">
            <h3>🎉 Order Placed Successfully!</h3>
            <p>
              Your order has been successfully placed. Our team will contact you
              within 24–48 hours.
            </p>
            <button onClick={handleClosePopup}>OK</button>
          </div>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default DeliveryAddressForm;
