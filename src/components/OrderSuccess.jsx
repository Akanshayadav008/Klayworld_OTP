import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  useEffect(() => {
    const sendSuccessEmail = async () => {
      // ✅ Get all necessary order data
      const billing = JSON.parse(localStorage.getItem("billingAddress") || "{}");
      const delivery = JSON.parse(localStorage.getItem("deliveryAddress") || "{}");
      const cartItems = JSON.parse(localStorage.getItem("galleryCart") || "[]");

      const email = billing?.companyEmail || billing?.email;
      if (!email || cartItems.length === 0) return;

      // ✅ Calculate subtotal
      const subtotal = cartItems.reduce((total, item) => {
        const sqft = item.sqftPerUnit ? item.quantity * item.sqftPerUnit : 0;
        return total + (item.price * sqft || 0);
      }, 0);

      try {
        await fetch("http://localhost:3000/send-success-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: email,
            billingData: billing,
            deliveryData: delivery,
            cartItems,
            subtotal,
          }),
        });
      } catch (err) {
        console.error("❌ Error sending success email:", err);
      }
    };

    sendSuccessEmail();
  }, []);

  return (
    <>
      <Header />
      <div className="os-container">
        <div className="os-box">
          <div className="os-success">
            <span>✔️</span> Order placed successfully
          </div>
          <div className="os-logo-section">
            <img
              src="https://seeklogo.com/images/R/razorpay-logo-83C707EF3F-seeklogo.com.png"
              alt="Razorpay"
            />
          </div>
          <p className="os-text">Your order is in process.</p>
          <p className="os-text">
            Please check your email for more details. If you have any queries,
            please feel free to contact{" "}
            <span className="os-contact">+91-9998333033</span> our support team.
          </p>
          <div className="os-buttons">
            <a className="os-btn os-home-btn" href="/">
              Back to home
            </a>
            <button className="os-btn os-shop-btn">Shop more</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderSuccess;
