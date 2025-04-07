import React from "react";
import "../components/TeamSection.css"; // Make sure to create this CSS file

const teamMembers = [
  {
    name: "Nakul Kapur",
    image: "/images/nakul.webp", 
    desc: "Head of Business Development",
  },
  {
    name: "Anuradha Trikha",
    image: "/images/anuradha.webp",
    desc: "Head of Channel Sales - Architects (Dee Pearls, Wood Idea and Klay)",
  },
  {
    name: "Ravi Dhiman",
    image: "/images/ravi.webp",
    desc: "Head of Purchase and BD Operations",
  },
  {
    name: "Abhishek Singh",
    image: "/images/abhishek.webp",
    desc: "Head of Inwards and Outwards Operations at KLAY",
  },
  {
    name: "Indra Prakash Pandey",
    image: "/images/indra.webp",
    desc: "Head of Warehousing at KLAY",
  },
];

const TeamSection = () => {
  return (
    <div className="team-container">
      <h2 className="team-title">Team Members</h2>
      <p className="team-subtitle">
        Our team draws on board industry experience and networks to create the
        most powerful outcomes for our clients and customers.
      </p>

      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <div className="team-member" key={index}>
            <img src={member.image} alt={member.name} className="team-image" />
            <p className="team-name">{member.name}</p>
            <p className="team-desc">{member.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;
