import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./OrderSuccess.css";

// Example function to simulate storing the billing address
// In your actual app, this should be done when the user submits billing details.
const storeBillingAddress = () => {
  const billingAddress = {
    street: "123 Main St",
    city: "Your City",
    email: "akanshaydv9@gmail.com", // Replace with the actual user email
    // ...other billing fields
  };
  localStorage.setItem("billingAddress", JSON.stringify(billingAddress));
};

// Call this function somewhere in your checkout process.
// For demonstration purposes, we call it immediately here.
storeBillingAddress();

const OrderSuccess = () => {

  useEffect(() => {
    const sendSuccessEmail = async () => {
      try {
        // Retrieve billing address from local storage
        const storedBillingAddress = localStorage.getItem("billingAddress");
        if (storedBillingAddress) {
          const billingAddress = JSON.parse(storedBillingAddress);
          const email = billingAddress?.email;
          if (email) {
            // Trigger the email send using the backend API
            const response = await fetch("http://localhost:3000/send-success-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ to: email }),
            });
  
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Email failed:", errorText);
            } else {
              console.log("Success email sent!");
            }
          } else {
            console.error("No email found in the billing address.");
          }
        } else {
          console.error("Billing address not found in local storage.");
        }
      } catch (err) {
        console.error("Error sending email:", err);
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
            please feel free to contact <span className="os-contact">+91-9998333033</span> our support team.
          </p>
          <div className="os-buttons">
            <a className="os-btn os-home-btn" href="/">Back to home</a>
            <button className="os-btn os-shop-btn">Shop more</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderSuccess;


