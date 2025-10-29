import React from "react";
import "../components/ContactForm.css"; 
import Header from "./Header";
import Footer from "./Footer";
import MapComponent from "./MyMapComponent";

const ContactForm = () => {
  return (
    <>

   <MapComponent />

    <div className="contact-container">
      <div className="contact-info">
        <div className="contact-item">
          <span className="contact-icon">📞</span>
          <p>+91 98714 00020</p>
        </div>
        <div className="contact-item">
          <span className="contact-icon">✉️</span>
          <p>info@klayworld.com</p>
        </div>
        <div className="contact-item">
          <span className="contact-icon">📍</span>
          <p>
            4, Sewa Corporate Suites,<br />
            Mehrauli-Gurgaon Rd, Gurugram,<br />
            Haryana 122002
          </p>
        </div>
       {/*
        <div className="social-media">
          <h4>Follow Us</h4>
      <div className="social-icons">
            <span>📷</span> <span>📘</span> <span>▶️</span>
          </div>
        </div>*/}
      </div>

      <div className="contact-form">
        <h3>Your Query</h3>
        <form>
          <div className="form-row">
            <input type="text" placeholder="Name*" required />
            <input type="email" placeholder="Email*" required />
          </div>
          <input type="text" placeholder="Subject*" required />
          <textarea placeholder="Your Message*" required></textarea>
          <button type="submit">SEND</button>
        </form>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default ContactForm;
