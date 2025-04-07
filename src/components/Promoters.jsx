import React from 'react'
import '../components/Promoters.css'

const Promoters = ({ image, name, title, description }) => {
    return (
      <div className="promoter-member">
        <img src={`images/${image}`} alt={name} className="team-member-image" />
        <div className="promoter-member-info">
          <h2 className="promoter-member-name">{name}</h2>
          <p className="promoter-member-title">{title}</p>
          <p className="promoter-member-description">{description}</p>
        </div>
      </div>
    );
  };

export default Promoters