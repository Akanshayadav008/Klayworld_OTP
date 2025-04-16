import React, { useState } from 'react';
import Stepper from './Stepper';
import DeliveryAddressForm from './FormDelivery';
import BillingAddressForm from './BillingAddressForm';
import OrderSummary from './OrderSummary';
import './DeliveryAddress.css';

function DeliveryAddress() {
  const [currentStep, setCurrentStep] = useState(1);

  const goToNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const goToPreviousStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <>
      <Stepper currentStep={currentStep} />

      {currentStep === 1 && <DeliveryAddressForm onNext={goToNextStep} />}
      {currentStep === 2 && <BillingAddressForm onNext={goToNextStep} onBack={goToPreviousStep} />}
      {currentStep === 3 && <PaymentForm onNext={goToNextStep} onBack={goToPreviousStep} />}
      {currentStep === 4 && <OrderSummary />}
    </>
  );
}

export default DeliveryAddress;
