import React, { useState } from "react"; // ✅ Added useState
import "./Footer.css"; 
import About from "./About";
import ContactForm from "./ContactForm";
import Home from "./Home";
import BlogCard from "./BlogCard";

const Footer = () => {
  const [email, setEmail] = useState(""); // ✅ No syntax errors now

  const handleSubmit = async (e) => {
    e.preventDefault();

    const scriptURL = "https://script.google.com/macros/s/AKfycbyB77j5RZpujGjlqMx1Tlym9siyMOEaFhWeU6yzl6sbvqfvC6HAov9mock4V9jmsU0/exec"; // ✅ Replace with your real URL

    try {
      let response = await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });

      let result = await response.text();
      if (result === "Success") {
        alert("Subscription successful!");
        setEmail(""); // ✅ Clears input after success
      } else {
        alert("Subscription failed. Please try again.");
      }
    } catch (error) {
      alert("Error submitting form. Check console for details.");
      console.error("Error:", error);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column footer-brand">
          <img className="footer-title" src="/images/logo-foot.webp"/>
          <p className="footer-description">
            Klay is a trusted brand name in the distribution and retail of
            premium Diesel. Based in the posh locality of Gurgaon, this is the
            largest high street tile retail store and the leading display center
            of large format tile sales in North India. With a rich variety of
            Indian and Italian origin surfaces, our satisfied clients include
            the biggest names amongst the HNI, Hospitality, Education, Industrial,
            and Architectural fraternity.
          </p>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">ABOUT KLAY</h3>
          <ul className="footer-links">
            <li><a href="/About">About us</a></li>
            <li><a href="/ContactForm">Store location</a></li>
            <li><a href="/ContactForm">Contact</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">THE COMPANY</h3>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="#shop-now">Shop Now</a></li>
            <li><a href="/BlogCard">Blogs</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">CONTACT INFO</h3>
          <address className="footer-contact">
            4, Seven Corporate Suites,<br />
            NetwralFurgon Rd,<br />
            Gurgaon, Haryana 122002
          </address>
          <p className="footer-contact">+91 9871400020</p>
          <p className="footer-contact">
            <a href="mailto:info@klayworld.com" className="footer-email">
              info@klayworld.com
            </a>
          </p>
        </div>
      </div>

      <div className="footer-subscribe">
        <h3 className="subscribe-heading">SUBSCRIBE</h3>
        <p className="subscribe-text">
          Get our email updates about special offers and new products.
        </p>
        <form className="subscribe-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="subscribe-input"
            placeholder="Enter your email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="subscribe-button">
            Subscribe
          </button>
        </form>
      </div>
    </footer>
  );
};

export default Footer;
