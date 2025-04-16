import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BillingAddressForm.css";

const BillingAddressForm = ({ onCheckout }) => {
  const navigate = useNavigate();
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

  const [showRazorpay, setShowRazorpay] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = () => {
    setSameAsDelivery(!sameAsDelivery);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Billing Form:", formData);

    if (onCheckout) {
      onCheckout(formData.companyEmail);
    }

    setShowRazorpay(true);
  };

  const initiateRazorpayPayment = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 500 }), // ₹500
      });

      const data = await response.json();

      const options = {
        key: "rzp_test_YYsy1KPyoTws9L", // Replace with your Razorpay key
        amount: data.amount,
        currency: "INR",
        name: "Your Company Name",
        description: "Billing Payment",
        image: "https://your-website.com/logo.png",
        order_id: data.orderId,
        handler: function (response) {
          alert("Payment successful!");
          console.log("Payment response:", response);
          navigate("/order-success");
        },
        prefill: {
          name: formData.companyName,
          email: formData.companyEmail,
          contact: formData.contactNo,
        },
        notes: {
          address: formData.address,
        },
        theme: {
          color: "#F37254",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      alert("Oops! Something went wrong.\nPayment Failed");
      console.error("Payment error:", err);
    }
  };

  if (showRazorpay) {
    return (
      <div className="razorpay-container">
        <h2>Proceed with Payment</h2>
        <button onClick={initiateRazorpayPayment} className="razorpay-btn">
          Pay with Razorpay
        </button>
      </div>
    );
  }

  return (
    <div className="billing-container">
      <h2 className="billing-title">Fill Billing Address</h2>

      <label className="billing-checkbox-group">
        <input
          type="checkbox"
          checked={sameAsDelivery}
          onChange={handleCheckboxChange}
        />
        <span>Same as delivery address</span>
      </label>

      <form onSubmit={handleSubmit}>
        <div className="billing-grid">
          <input
            type="text"
            placeholder="Company name*"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            placeholder="Company Email*"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Contact no.*"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Postal Code*"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
          />
          <select name="country" value={formData.country} onChange={handleChange} required>
            <option value="">Country*</option>
            <option value="India">India</option>
            <option value="USA">USA</option>
          </select>
          <select name="state" value={formData.state} onChange={handleChange} required>
            <option value="">State*</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
          </select>
          <select name="city" value={formData.city} onChange={handleChange} required>
            <option value="">City*</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
          </select>
          <input
            type="text"
            placeholder="Address*"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            placeholder="Company GST no"
            name="gstNo"
            value={formData.gstNo}
            onChange={handleChange}
          />
        </div>

        <div className="billing-actions">
          <button type="submit" className="billing-submit-btn">Save</button>
        </div>
      </form>
    </div>
  );
};

export default BillingAddressForm;
