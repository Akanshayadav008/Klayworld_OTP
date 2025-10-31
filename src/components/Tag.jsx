import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../components/CategoryPage.css";
import Footer from "./Footer";


const Tag = () => {
  const { tag } = useParams();
  const [products, setProducts] = useState([]);


  const formattedTag = tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("tag", "array-contains", formattedTag)
        );


        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setProducts([]);
          return;
        }


        const productList = snapshot.docs.map((doc) => {
          const data = doc.data();
         
          // Select first available image
          let imageURL =
            data.image?.[0] ||
            data.tileImage?.[0] ||
            data.highlighterRendersURL?.[0] ||
            "https://via.placeholder.com/200";


          return {
            id: doc.id,
            name: data.name,
            image: imageURL
          };
        });


        setProducts(productList);


      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };


    fetchProducts();
  }, [formattedTag]);


  return (
    <>
      <div className="category-section">
        <h1>{formattedTag}</h1>


        {products.length === 0 ? (
          <p>No products found for this tag.</p>
        ) : (
          <div className="finish-list">
            {products.map((item) => (
              <div key={item.id} className="finish-container">
                <img src={item.image} alt={item.name} className="finish-image"  onClick={() => (window.location.href = `/product-details?id=${item.id}`)} />
                <div className="finish-label" onClick={() => (window.location.href = `/product-details?id=${item.id}`)} >{item.name}</div>
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



