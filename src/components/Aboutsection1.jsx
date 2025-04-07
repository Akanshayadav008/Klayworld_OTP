import React from 'react'
import '../components/Aboutsection1.css'


function Aboutsection1({ image, title, description }) {
  return (
    <div className="vision-container">
      <img src={image} alt={title} className="vision-image" />
      <div className="vision-text">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default Aboutsection1