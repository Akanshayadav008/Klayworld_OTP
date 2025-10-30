import React from "react";
import { useNavigate } from "react-router-dom";
import "./CategoriesSection.css";

const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    { img: "images/residential.png", name: "Living Room" },
    { img: "images/residential.png", name: "Bathroom" },
    { img: "images/residential.png", name: "Kitchen" },
    { img: "images/residential.png", name: "Bedroom" },
    { img: "images/residential.png", name: "Outdoor" },
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
