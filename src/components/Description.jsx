import React, { useEffect, useState } from 'react';
import { db } from "./../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import './Description.css';
import Header from './Header';

const ProductDetails = () => {
  // State for the fetched product data (a single product object)
  const [product, setProduct] = useState(null);
  // State for the currently selected category (to change image)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  // States for variation selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [currentPrice, setCurrentPrice] = useState("₹0.00");
  const collectionName = "products";
  
  // Get the product id from query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const productId = queryParams.get("id");

  // Fetch product details when component mounts
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;

      try {
        // Fetch the document for the specific product using its ID
        const docRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { product_id: docSnap.id, ...docSnap.data() };
          setProduct(productData);

          // If product has variations, auto-select the first available size and thickness
          if (productData.variation && productData.variation.length > 0) {
            let sizesSet = new Set();
            productData.variation.forEach(variation => {
              variation.size.forEach(s => sizesSet.add(s.name));
            });
            const sizeArray = Array.from(sizesSet);
            if (sizeArray.length > 0) {
              setSelectedSize(sizeArray[0]);
              // Determine available thicknesses for the selected size
              let thicknessSet = new Set();
              productData.variation.forEach(variation => {
                variation.size.forEach(s => {
                  if (s.name === sizeArray[0]) {
                    thicknessSet.add(s.thickness || productData.thickness || "Default");
                  }
                });
              });
              const thicknessArray = Array.from(thicknessSet);
              if (thicknessArray.length > 0) {
                setSelectedThickness(thicknessArray[0]);
                updatePrice(sizeArray[0], thicknessArray[0], productData);
              }
            }
          }
        } else {
          console.error("No such document");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Update price based on selected size and thickness
  const updatePrice = (size, thickness, productData) => {
    let price = "₹0.00";
    productData.variation.forEach(variation => {
      variation.size.forEach(s => {
        if (s.name === size && (s.thickness === thickness || !s.thickness)) {
          price = `₹${s.price}`;
        }
      });
    });
    setCurrentPrice(price);
  };

  // Handle size selection; update available thickness options accordingly
  const handleSizeSelection = (size) => {
    setSelectedSize(size);
    setSelectedThickness(null);
    if (product) {
      let thicknessSet = new Set();
      product.variation.forEach(variation => {
        variation.size.forEach(s => {
          if (s.name === size) {
            thicknessSet.add(s.thickness || product.thickness || "Default");
          }
        });
      });
      const thicknessArray = Array.from(thicknessSet);
      if (thicknessArray.length > 0) {
        setSelectedThickness(thicknessArray[0]);
        updatePrice(size, thicknessArray[0], product);
      }
    }
  };

  // Handle thickness selection
  const handleThicknessSelection = (thickness) => {
    setSelectedThickness(thickness);
    if (product && selectedSize) {
      updatePrice(selectedSize, thickness, product);
    }
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  // Categories for image switch (if product.category exists)
  const categories = product.category ? Object.values(product.category) : [];
  // Select image based on chosen category index
  const productImage = product.image && product.image[selectedCategoryIndex] ? product.image[selectedCategoryIndex] : "placeholder.jpg";
  // Space options
  const spaces = product.space && Array.isArray(product.space) ? product.space : [];
  // Unique sizes from variation
  let sizesSet = new Set();
  product.variation && product.variation.forEach(variation => {
    variation.size.forEach(s => sizesSet.add(s.name));
  });
  const sizesArray = Array.from(sizesSet);
  // Available thicknesses for the selected size
  let thicknessSet = new Set();
  if (product.variation && selectedSize) {
    product.variation.forEach(variation => {
      variation.size.forEach(s => {
        if (s.name === selectedSize) {
          thicknessSet.add(s.thickness || product.thickness || "Default");
        }
      });
    });
  }
  const thicknessArray = Array.from(thicknessSet);

  return (
    <>
      <Header />
      <div className="product-container">
        <div className="product-gallery">
          <img src={productImage} alt="Product" />
          {/* Additional thumbnail images can be added here */}
        </div>
        <div className="product-details">
          <h1>{product.name || "No Name"}</h1>
          <p className="product-price">
            <span>&#8377; {product.price || "No Price"} /sqft</span>
          </p>
          <p><strong>Select Space:</strong></p>
          <div id="categoryContainer">
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <button
                  key={index}
                  className={`category-button ${selectedCategoryIndex === index ? 'selected' : ''}`}
                  onClick={() => setSelectedCategoryIndex(index)}
                >
                  {category}
                </button>
              ))
            ) : (
              <p>No Categories Available</p>
            )}
          </div>
          <p><strong>Category:</strong></p>
          <div id="spaceContainer" className="space-box-container">
            {spaces.length > 0 ? (
              spaces.map((space, index) => (
                <div key={index} className="space-box">{space}</div>
              ))
            ) : (
              <p>No Space Available</p>
            )}
          </div>
          <p><strong>Finish:</strong> <span>{product.finish || "No Finish"}</span></p>
          <p><strong>Brand:</strong> <span>{product.Brand || "-"}</span></p>
          <p>
            <strong>360:</strong> <span>
              {product.meta_view ? (
                <a href={product.meta_view} style={{ color: 'blue', textDecoration: 'underline' }}>
                  View 360° Image
                </a>
              ) : "-"}
            </span>
          </p>
          <p><strong>Location:</strong> <span>{product.Location || "No Location"}</span></p>
          <p><strong>Stock:</strong> <span>{product.stock || "Out of Stock"}</span></p>
          <p><strong>Description:</strong> <span>{product.shortDescription || "-"}</span></p>
          <hr />
          <p><strong>Select Size:</strong></p>
          <div id="sizeContainer" className="space-box-container">
            {sizesArray.length > 0 ? (
              sizesArray.map((size, index) => (
                <div
                  key={index}
                  className={`option-box ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => handleSizeSelection(size)}
                >
                  {size}
                </div>
              ))
            ) : (
              <p>No Sizes Available</p>
            )}
          </div>
          <p><strong>Select Thickness:</strong></p>
          <div id="thicknessContainer" className="space-box-container">
            {thicknessArray.length > 0 ? (
              thicknessArray.map((thickness, index) => (
                <div
                  key={index}
                  className={`option-box ${selectedThickness === thickness ? 'selected' : ''}`}
                  onClick={() => handleThicknessSelection(thickness)}
                >
                  {thickness}
                </div>
              ))
            ) : (
              <p>No Thickness Available</p>
            )}
          </div>
          <hr />
          <button id="buyNow">
            Buy Now - <span id="selectedPrice">{currentPrice}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
