// src/components/PaymentRazorpay.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";


const PaymentRazorpay = ({ /* if you had formData as prop, accept it here */ }) => {
  const navigate = useNavigate();


  // Load the Razorpay checkout script
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
    return () => document.body.removeChild(s);
  }, []);


  const handlePayment = async () => {
    try {
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500 }),
      });
      const { amount, orderId } = await res.json();


      const options = {
        key: "rzp_test_YYsy1KPyoTws9L",     // your test/live key
        amount,
        currency: "INR",
        name: "Your Company Name",
        description: "Order Payment",
        order_id: orderId,
        handler: () => {
          alert("Payment successful!");
          // ← Navigate to your OrderSuccess route
          navigate("/order-success");
        },
        theme: { color: "#F37254" },
      };


      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    }
  };


  return (
    <div className="payment-container">
      <h2>Proceed with Payment</h2>
      <button onClick={handlePayment} className="razorpay-btn">
        Pay ₹500
      </button>
    </div>
  );
};


export default PaymentRazorpay;



