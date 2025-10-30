import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../components/CategoryPage.css";
import Header from "./Header";
import Footer from "./Footer";

const Tag = () => {
  const { tag } = useParams(); // e.g. 'living-room'
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);

  // Convert 'living-room' → 'Living Room'
  const formattedTag = tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log(`📢 Fetching tags for category: ${formattedTag}`);

        // 🔍 Query Firestore for products that have this category
        const tagQuery = query(
          collection(db, "products"),
          where("category", "array-contains", formattedTag)
        );

        const querySnapshot = await getDocs(tagQuery);

        if (querySnapshot.empty) {
          console.log(`❌ No products found for category: ${formattedTag}`);
          setTags([]);
          return;
        }

        // 🧩 Extract unique tags from products
        let tagMap = new Map();

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.tag && Array.isArray(data.tag)) {
            data.tag.forEach((tagItem) => {
              if (!tagMap.has(tagItem)) {
                let imageURL = "https://via.placeholder.com/150";

                if (data.image && data.image.length > 0) imageURL = data.image[0];
                else if (data.tileImage && data.tileImage.length > 0)
                  imageURL = data.tileImage[0];
                else if (data.highlighterRendersURL && data.highlighterRendersURL.length > 0)
                  imageURL = data.highlighterRendersURL[0];

                tagMap.set(tagItem, { id: tagItem, label: tagItem, image: imageURL });
              }
            });
          }
        });

        setTags(Array.from(tagMap.values()));
      } catch (error) {
        console.error("❌ Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [formattedTag]);

  const handleTagClick = (selectedTag) => {
    navigate(`/productsearch?category=${formattedTag.toLowerCase()}&tag=${selectedTag.toLowerCase()}`);
  };

  return (
    <>
      <div className="category-section">
        <h1>{formattedTag} Tags</h1>
        {tags.length === 0 ? (
          <p>No tags found for this category.</p>
        ) : (
          <div className="finish-list">
            {tags.map((item) => (
              <div
                key={item.id}
                className="finish-container"
                onClick={() => handleTagClick(item.label)}
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

export default Tag;
