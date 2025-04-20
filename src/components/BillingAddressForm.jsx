// src/components/BillingAddressForm.js
import React, { useState } from "react";
import "./BillingAddressForm.css";

const BillingAddressForm = ({ onNext, onBack }) => {
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    contactNo: "",
    postalCode: "",
    country: "",
    state: "",
    city: "",
    address: "",
    gstNo: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = () => setSameAsDelivery((p) => !p);

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Save billing address in localStorage to be used in OrderSuccess
    localStorage.setItem("billingAddress", JSON.stringify(formData));

    // ✅ Go to next step
    onNext();
  };

  return (
    <div className="billing-container">
      <button onClick={onBack} className="back-btn">← Back</button>
      <h2>Billing Address</h2>
      <br />
      <form onSubmit={handleSubmit}>
        <div className="billing-grid">
          <input
            name="companyName"
            placeholder="Company name*"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="companyEmail"
            placeholder="Company Email*"
            value={formData.companyEmail}
            onChange={handleChange}
            required
          />
          <input
            name="contactNo"
            placeholder="Contact no.*"
            value={formData.contactNo}
            onChange={handleChange}
            required
          />
          <input
            name="postalCode"
            placeholder="Postal Code*"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          >
            <option value="">Country*</option>
            <option>India</option>
            <option>USA</option>
          </select>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          >
            <option value="">State*</option>
            <option>Maharashtra</option>
            <option>Delhi</option>
          </select>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          >
            <option value="">City*</option>
            <option>Mumbai</option>
            <option>Pune</option>
          </select>
          <input
            name="address"
            placeholder="Address*"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <input
            name="gstNo"
            placeholder="Company GST no"
            value={formData.gstNo}
            onChange={handleChange}
          />
        </div>
        <br />
        <button type="submit" className="billing-submit-btn">
          Continue to Payment
        </button>
      </form>
    </div>
  );
};

export default BillingAddressForm;
