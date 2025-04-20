import React from 'react';
import './OrderSummary.css';

const OrderSummary = () => {
  const subtotal = 4500;
  const delivery = 20;
  const discount = 0;
  const total = subtotal + delivery - discount;

  return (
    <div className="order-summary-container">
      <div className="order-summary-box">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>Delivery Charges</span>
          <span>₹{delivery}</span>
        </div>
        <div className="summary-row">
          <span>Discount</span>
          <span>--</span>
        </div>
        <hr />
        <div className="summary-row total">
          Total Amount
         ₹{total.toLocaleString()}
        </div>
        <button className="checkout-btn">Checkout</button>
      </div>

      <div className="order-note-box">
        <h4>Note</h4>
        <ul>
          <li><strong>30%</strong> advance payment is required before purchasing any product, with the remaining <strong>70%</strong> payable upon delivery.</li>
          <li>For sample bookings, full payment will be required.</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderSummary;
