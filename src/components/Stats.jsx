import React from "react";
import { Icon } from "@iconify/react";
import "../components/Stats.css";

function Stats() {
  const statsData = [
    {
      icon: "fluent:table-simple-24-regular", // Replace with the correct icon name
      number: "1000+",
      text: "Collections of Tiles",
    },
    {
      icon: "tabler:trophy",
      number: "2mn+",
      text: "Sqft of Project executed",
    },
    {
      icon: "mdi:earth",
      number: "50+",
      text: "Cities Served",
    },
    {
      icon: "mdi:star-outline",
      number: "40",
      text: "Years of Experience in Surfaces",
    },
  ];

  return (
    <div className="stats-section">
      {statsData.map((item, index) => (
        <div className="stat-item" key={index}>
          <Icon icon={item.icon} className="stat-icon" />
          <h2 className="stat-number">{item.number}</h2>
          <p className="stat-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

export default Stats;
