import React from "react";
import "./Stepper.css"; // You'll define the styles here

const steps = [
  { title: "Delivery Address", step: 1 },
  { title: "Billing Address", step: 2 },
  { title: "Payment", step: 3 },
  { title: "Order Process", step: 4 },
];

const Stepper = ({ currentStep }) => {
  return (
    <div className="stepper-container">
      <h2 className="stepper-title">Shopping Cart</h2>
      <div className="stepper-box">
        {steps.map((item, index) => {
          const isActive = currentStep === item.step;
          const isCompleted = item.step < currentStep;

          return (
            <div key={item.step} className="stepper-step">
              <div className="stepper-content">
                <div
                  className={`stepper-circle ${
                    isActive
                      ? "active"
                      : isCompleted
                      ? "completed"
                      : "pending"
                  }`}
                >
                  <div
                    className={`inner-dot ${
                      isActive
                        ? "dot-active"
                        : isCompleted
                        ? "dot-completed"
                        : "dot-pending"
                    }`}
                  ></div>
                </div>
                <div className="step-label">STEP {item.step}</div>
                <div className="step-title">{item.title}</div>
                <div className="step-status">Pending</div>
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={`step-line ${
                    isCompleted || isActive ? "line-active" : "line-pending"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
