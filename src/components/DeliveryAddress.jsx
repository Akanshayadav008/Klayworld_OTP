import React, { useState } from "react";
import Stepper from "./Stepper";
import DeliveryAddressForm from "./FormDelivery";
import BillingAddressForm from "./BillingAddressForm";
import PaymentRazorpay from "./PaymentRazorpay";
import OrderSummary from "./OrderSummary";

function DeliveryAddress() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryData, setDeliveryData] = useState(null); // ✅ store delivery

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // ✅ When OTP is verified
  const handleDeliveryComplete = async (deliveryInfo) => {
    setDeliveryData(deliveryInfo); // store it
    await sendCartEmail(deliveryInfo); // send email to admin/customer
    goNext(); // go to billing
  };

  const sendCartEmail = async (delivery) => {
    try {
      const response = await fetch("http://localhost:3000/send-cart-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: delivery.email,
          deliveryData: delivery,
          cartItems: JSON.parse(localStorage.getItem("galleryCart")) || [],
          subtotal: 500, // ← put correct subtotal logic here
        }),
      });

      const result = await response.json();
      console.log("Email response:", result);
      alert("Emails sent successfully.");
    } catch (err) {
      console.error("Failed to send cart email:", err);
    }
  };

  return (
    <div className="checkout-wizard">
      <Stepper currentStep={currentStep} />

      {currentStep === 1 && (
        <DeliveryAddressForm onNext={handleDeliveryComplete} />
      )}

      {currentStep === 2 && (
        <BillingAddressForm onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 3 && (
        <PaymentRazorpay deliveryData={deliveryData} onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 4 && <OrderSummary />}
    </div>
  );
}

export default DeliveryAddress;
