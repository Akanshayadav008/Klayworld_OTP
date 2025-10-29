import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import "../components/ConsultingSection.css";
import { InlineWidget } from "react-calendly";
import Header from "./Header";
import Footer from "./Footer";

const consultingServices = [
  {
    icon: "mdi:hammer-wrench",
    text: "Installation Support",
  },
  {
    icon: "mdi:cube-scan",
    text: "Design Support - with 3D Visualisation",
  },
  {
    icon: "mdi:truck-delivery",
    text: "Logistics services across India",
  },
  {
    icon: "mdi:square-edit-outline",
    text: "Customisation Services",
  },
];

const ConsultingSection = () => {
  
  // Ensure page starts from top when navigated
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="consulting-container">
        <h2 className="consulting-title">Book a Session with our Consulting Team</h2>

        {/* Service Box */}
        <div className="consulting-box">
          {consultingServices.map((service, index) => (
            <div className="consulting-item" key={index}>
              <Icon icon={service.icon} className="consulting-icon" />
              <p>{service.text}</p>
            </div>
          ))}
        </div>

        {/* Calendly Widget */}
        <div className="calendly-container">
          <InlineWidget url="https://calendly.com/klay-world/book-a-session" />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ConsultingSection;
