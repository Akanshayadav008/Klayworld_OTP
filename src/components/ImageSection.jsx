import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "../components/ImageSection.css";

const ImageSection = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Static mapping of category names to images
  const categoryImages = {
    Bathroom: "/images/matt-bathroom.webp",
    LivingRoom: "/images/living-room.webp",
    Kitchen: "/images/kitchen.webp",
    Terrace: "/images/concreto.webp",
    Balcony: "/images/balcony.webp",
    Outdoor: "/images/outdoor.jpg",
    Facade: "/images/facade.webp",
    Exterior: "/images/exterior.jpg",
    Driveway: "/images/driveway.webp",
    Countertops: "/images/countertop.jpg",
    default: "/images/living-room.webp",
  };
  
  // Function to format the category name to match image keys
  const formatCategoryKey = (category) => {
    return category
      .toLowerCase()
      .replace(/\s+/g, '') // Remove spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter
  };
  
  const selectedCategory = "Living Room"; // Fetched from Firestore
  const formattedCategory = formatCategoryKey(selectedCategory);
  const imageSrc = categoryImages[formattedCategory] || categoryImages.default;
  
  console.log(imageSrc);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("📢 Fetching categories from Firestore...");

        const querySnapshot = await getDocs(collection(db, "products"));

        if (querySnapshot.empty) {
          console.log("❌ No categories found in Firestore!");
          return;
        }

        let uniqueCategories = new Set();

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.category && Array.isArray(data.category)) {
            data.category.forEach((category) => {
              uniqueCategories.add(category);
            });
          }
        });

        const finalCategories = Array.from(uniqueCategories).map((category) => ({
          id: category,
          label: category,
          image: categoryImages[category] || categoryImages.default, // Use static images
        }));

        console.log("✅ Fetched Categories with Static Images:", finalCategories);
        setCategories(finalCategories);
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    if (category === "Living Room") {
      navigate(`/collection?category=${encodeURIComponent(category)}`);
    } else {
      navigate(`/collection/${category.toLowerCase().replace(/\s+/g, "-")}`);
    }
  };

  return (
    <div className="collection-section">
      {categories.length === 0 ? (
        <p>Loading categories...</p>
      ) : (
        categories.map((item) => (
          <div key={item.id} className="collection-container" onClick={() => handleCategoryClick(item.label)}>
            <img src={item.image} alt={item.label} className="collection" />
            <div className="collection-label">{item.label}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default ImageSection;
