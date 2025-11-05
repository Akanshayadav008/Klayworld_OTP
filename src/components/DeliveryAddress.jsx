import React, { useState } from "react";
import DeliveryAddressForm from "./FormDelivery";
import BillingAddressForm from "./BillingAddressForm";
import PaymentRazorpay from "./PaymentRazorpay";
import OrderSummary from "./OrderSummary";
import "./DeliveryAddress.css"; // optional, for layout tweaks

function DeliveryAddress() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryData, setDeliveryData] = useState(null);

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 4));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleDeliveryComplete = async (deliveryInfo) => {
    setDeliveryData(deliveryInfo);
    await sendCartEmail(deliveryInfo);
    goNext();
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
          subtotal: 500,
        }),
      });

      const result = await response.json();
      console.log("Email response:", result);
    } catch (err) {
      console.error("Failed to send cart email:", err);
    }
  };

  return (
    <div className="checkout-wizard-full">
      {currentStep === 1 && (
        <DeliveryAddressForm onNext={handleDeliveryComplete} />
      )}

      {currentStep === 2 && (
        <BillingAddressForm onNext={goNext} onBack={goBack} />
      )}

      {currentStep === 3 && (
        <PaymentRazorpay
          deliveryData={deliveryData}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 4 && <OrderSummary />}
    </div>
  );
}

export default DeliveryAddress;
