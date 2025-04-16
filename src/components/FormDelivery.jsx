import React, { useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import "./FormDelivery.css";

const locationData = {
  India: {
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  },
  USA: {
    California: ["Los Angeles", "San Francisco"],
    Texas: ["Houston", "Austin"],
  },
};

const DeliveryAddressForm = ({ onNext }) => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    pincode: "",
    landmark: "",
    houseNumber: "",
    email: "",
    contact: "",
  });

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOTP = (e) => {
    e.preventDefault();

    if (!formData.contact || formData.contact.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }

    // Mocking OTP send
    setShowOTPModal(true);
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    try {
      // Assume OTP is always correct (mock)
      await addDoc(collection(db, "deliveryAddresses"), {
        ...formData,
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        phoneVerified: true,
        timestamp: new Date(),
      });

      alert("Phone number verified and address saved!");
      setShowOTPModal(false);

      if (onNext) onNext(); // Go to billing address
    } catch (error) {
      console.error("Failed to save address:", error);
      alert("Failed to save address: " + error.message);
    }
  };

  const countries = Object.keys(locationData);
  const states = selectedCountry ? Object.keys(locationData[selectedCountry]) : [];
  const cities = selectedState ? locationData[selectedCountry]?.[selectedState] || [] : [];

  return (
    <div className="delivery-container">
      <h3 className="delivery-title">Fill Delivery Address</h3>
      <form className="delivery-grid" onSubmit={handleSendOTP}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name*"
          className="delivery-input"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last name"
          className="delivery-input"
          onChange={handleChange}
        />
        <select
          className="delivery-input"
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState("");
            setSelectedCity("");
          }}
          required
        >
          <option value="">Country*</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          className="delivery-input"
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCity("");
          }}
          disabled={!selectedCountry}
          required
        >
          <option value="">State*</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <select
          className="delivery-input"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          disabled={!selectedState}
          required
        >
          <option value="">City*</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="pincode"
          placeholder="Pincode*"
          className="delivery-input"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="landmark"
          placeholder="Landmark*"
          className="delivery-input"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="houseNumber"
          placeholder="House/Office no.*"
          className="delivery-input"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email*"
          className="delivery-input"
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="contact"
          placeholder="Contact no.*"
          className="delivery-input"
          onChange={handleChange}
          required
        />

        <div className="delivery-button-wrapper">
          <button className="send-otp-btn" type="submit">
            Send OTP
          </button>
        </div>
      </form>

      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-content">
            <h2>Verify your phone</h2>
            <p className="otp-subtext">
              Enter the 6-digit code sent to your mobile number
            </p>
            <form onSubmit={handleOTPSubmit} className="otp-form">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="otp-input-box"
                placeholder="Enter OTP"
                required
              />
              <button type="submit" className="verify-btn">
                Verify
              </button>
            </form>
            <p className="resend-text" onClick={handleSendOTP}>
              Didn’t receive code? <span>Resend</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressForm;
