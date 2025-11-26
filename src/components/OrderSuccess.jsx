import React from "react";

export default function OrderSuccess() {
  return (
    <>
      <div className="success-container">
        <h2>🎉 Order Placed Successfully!</h2>
        <p>Your order has been placed.</p>
        <p>Our team will get back to you within 24–48 hours.</p>

        <button onClick={() => (window.location.href = "/")}>
          Go to Home
        </button>
      </div>

      <style>{`
        .success-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
        }
        .success-container button {
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
