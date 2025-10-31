import React from "react";
import { useNavigate } from "react-router-dom";
import "./CategoriesSection.css";

const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    { img: "images/residential.png", name: "Residential" },
    { img: "images/hotel.png", name: "Hospitality" },
    { img: "images/commercial.png", name: "Commercial" },
    { img: "images/restaurant.png", name: "Restaurants" },
    { img: "images/Corporate.png", name: "Corporate" },
    { img: "images/retail.png", name: "Retail" },

  ];

  const handleCategoryClick = (name) => {
    const formatted = name.toLowerCase().replace(/\s+/g, "-");
    navigate(`/tag/${formatted}`);
  };

  return (
    <section className="categories-section">
      <div className="categories-container">
        {categories.map((category, index) => (
          <div
            className="category-item"
            key={index}
            onClick={() => handleCategoryClick(category.name)}
          >
            <img src={category.img} alt={category.name} />
            <p>{category.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
