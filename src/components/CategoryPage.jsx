import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../components/CategoryPage.css";
import Header from "./Header";
import Footer from "./Footer";

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [finishes, setFinishes] = useState([]);

  // Capitalize first letter to match Firestore data
  const formattedCategory =
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  useEffect(() => {
    const fetchFinishes = async () => {
      try {
        console.log(`📢 Fetching finishes for category: ${formattedCategory}`);

        const categoryQuery = query(
          collection(db, "products"),
          where("category", "array-contains", formattedCategory)
        );

        const querySnapshot = await getDocs(categoryQuery);

        if (querySnapshot.empty) {
          console.log(`❌ No products found for category: ${formattedCategory}`);
          return;
        }

        let finishMap = new Map();

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.finish && Array.isArray(data.finish)) {
            data.finish.forEach((finish) => {
              if (!finishMap.has(finish)) {
                let imageURL = "https://via.placeholder.com/150"; // Default image
                
                if (data.image && Array.isArray(data.image) && data.image.length > 0) {
                  imageURL = data.image[0];
                } else if (data.tileImage && Array.isArray(data.tileImage) && data.tileImage.length > 0) {
                  imageURL = data.tileImage[0];
                } else if (data.highlighterRendersURL && Array.isArray(data.highlighterRendersURL) && data.highlighterRendersURL.length > 0) {
                  imageURL = data.highlighterRendersURL[0];
                }

                finishMap.set(finish, { id: finish, label: finish, image: imageURL });
              }
            });
          }
        });

        setFinishes(Array.from(finishMap.values()));
      } catch (error) {
        console.error("❌ Error fetching finishes:", error);
      }
    };

    fetchFinishes();
  }, [formattedCategory]);

  // ✅ Navigate to search page with selected category & finish
  const handleFinishClick = (finish) => {
    navigate(`/productsearch?category=${formattedCategory.toLowerCase()}&finish=${finish.toLowerCase()}`);
  };

  return (
    <>
      <Header />
      <div className="category-section">
        <h1>{formattedCategory} Finishes</h1>
        {finishes.length === 0 ? (
          <p>No finishes found for this category.</p>
        ) : (
          <div className="finish-list">
            {finishes.map((item) => (
              <div
                key={item.id}
                className="finish-container"
                onClick={() => handleFinishClick(item.label)}
              >
                <img src={item.image} alt={item.label} className="finish-image" />
                <div className="finish-label">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CategoryPage;
