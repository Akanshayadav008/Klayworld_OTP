import React, { useEffect, useState } from 'react';
import { db } from './../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './Description.css';
import Header from './Header';
import Footer from './Footer';


// Import necessary functions from Firestore
import { query, where, getDocs, limit, collection } from 'firebase/firestore';

const fetchSimilarProducts = async () => {
  if (!product.category) return;

  try {
    // Create a query to fetch similar products
    const q = query(
      collection(db, "products"),
      where("category", "==", product.category),
      where("name", "!=", product.name), // ensure we don't include the current product
      limit(4) // limit to 4 similar products
    );

    // Get the documents that match the query
    const querySnapshot = await getDocs(q);
    const similar = [];
    querySnapshot.forEach((doc) => {
      similar.push({ id: doc.id, ...doc.data() });
    });
    setSimilarProducts(similar);
  } catch (error) {
    console.error("Error fetching similar products:", error);
  }
};




const ProductDetails = () => {
  // State for fetched product data
  const [product, setProduct] = useState(null);
  // For switching main image/category
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  // Variation selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [currentPrice, setCurrentPrice] = useState("₹0.00");
  // New state for the tab in second part
  const [activeTab, setActiveTab] = useState("Product Images");


  const collectionName = "products";
  const queryParams = new URLSearchParams(window.location.search);
  const productId = queryParams.get("id");
  const [similarProducts, setSimilarProducts] = useState([]);

  
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product || !product.space) return;
  
      // Reference to Firestore collection
      const q = query(
        collection(db, "products"),
        where("space", "==", product.space), // Adjusted to match the category
        where("name", "!=", product.name), // Make sure we don't include the current product
        limit(3) // Limit to 4 similar products
      );
  
      try {
        const querySnapshot = await getDocs(q);
        const similar = [];
        querySnapshot.forEach((doc) => {
          similar.push({ id: doc.id, ...doc.data() });
        });
        setSimilarProducts(similar);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      }
    };
  
    if (product) {
      fetchSimilarProducts();
    }
  }, [product]); // Re-run whenever the product data changes
  
  
  // Fetch product details from Firestore
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      try {
        const docRef = doc(db, collectionName, productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { product_id: docSnap.id, ...docSnap.data() };
          setProduct(productData);


          // Auto-select first available size & thickness if variation exists
          if (productData.variation && productData.variation.length > 0) {
            let sizesSet = new Set();
            productData.variation.forEach(variation => {
              variation.size.forEach(s => sizesSet.add(s.name));
            });
            const sizeArray = Array.from(sizesSet);
            if (sizeArray.length > 0) {
              setSelectedSize(sizeArray[0]);
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


  // Function to update price based on selection
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


  // Handle size selection
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


  // Prepare dynamic fields
  const categories = product.category ? Object.values(product.category) : [];
  const productImage = product.image && product.image[selectedCategoryIndex] ? product.image[selectedCategoryIndex] : "placeholder.jpg";
  const spaces = product.space && Array.isArray(product.space) ? product.space : [];
  let sizesSet = new Set();
  product.variation && product.variation.forEach(variation => {
    variation.size.forEach(s => sizesSet.add(s.name));
  });
  const sizesArray = Array.from(sizesSet);
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


  const handleAddToGallery = () => {
    if (!product.vendor_id || product.vendor_id.length === 0) {
      alert("This product is not available.");
      return;
    }


    // Prepare the product object to store
    const selectedProduct = {
      tileImage: product.tileImage?.[0] || "",
      ratings: product.ratings || "5.0", // default rating if missing
      vendor_id: product.vendor_id,
      name: product.name,
      selectedThickness: selectedThickness,
      space: product.space,
      selectedSize: selectedSize,
      price: currentPrice,
      id: product.product_id,
      sample: false, // ✅ Mark as not a sample
    };


    // Get existing gallery/cart from localStorage
    let galleryCart = JSON.parse(localStorage.getItem("galleryCart")) || [];


    // Optional: Prevent duplicates by checking product ID
    const isAlreadyInCart = galleryCart.some(item => item.id === selectedProduct.id);
    if (isAlreadyInCart) {
      alert("Product is already added to the gallery.");
      return;
    }


    // Add new product to cart
    galleryCart.push(selectedProduct);


    // Save back to localStorage
    localStorage.setItem("galleryCart", JSON.stringify(galleryCart));


    // Show alert
    alert("Product added to gallery!");
  };
  const handleBookSample = () => {
 
    const selectedProduct = {
      tileImage: product.tileImage?.[0] || "",
      ratings: product.ratings || "5.0",
      vendor_id: product.vendor_id,
      name: product.name,
      selectedThickness: selectedThickness,
      space: product.space,
      selectedSize: selectedSize,
      price: currentPrice,
      id: product.product_id,
      sample: true, // ✅ Mark as sample
    };
 
    let galleryCart = JSON.parse(localStorage.getItem("galleryCart")) || [];
 
    const isAlreadyInCart = galleryCart.some(item => item.id === selectedProduct.id && item.sample === true);
    if (isAlreadyInCart) {
      alert("Sample is already booked for this product.");
      return;
    }
 
    galleryCart.push(selectedProduct);
    localStorage.setItem("galleryCart", JSON.stringify(galleryCart));
 
    alert("Sample booked successfully!");
  };
 
 




  return (
    <>
      <Header />
      <div className="product-container">
        {/* Left: Main Product Image */}
        <div className="product-gallery">
          <img src={productImage} alt="Product" />
        </div>
        {/* Product Thumbnails */}
        <div className="product-thumbnails">
          <div className="small-images">
            {product.image && product.image.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail ${selectedCategoryIndex === index ? 'active' : ''}`}
                onClick={() => setSelectedCategoryIndex(index)}
              />
            ))}
          </div>
          <p>


            {product.meta_view ? (
              <a href={product.meta_view} >
                <img src='images/icons/360 png.png' alt="360 View" className='meta_view' />
              </a>
            ) : "-"}


          </p>
        </div>
        {/* Right: Product Details */}
        <div className="product-details" >
          <p className='header-top'>
            <span style={{ fontstyle: "normal", fontWeight: "700", fontSize: "28px" }}>{product.name || "No Name"}</span>
            <img src='images/icons/image 12.png' alt="wish-icone" className='wish-icone' />
          </p>
          <p className="product-price">
            <span>
              <span style={{ color: "#00BD29", fontFamily: "SF Pro Display", fontWeight: "500", fontstyle: "normal" }}>&#8377; {product.price || "No Price"}  </span>
              <span style={{ fontFamily: "SF Pro Display", fontWeight: "normal" }}>/Sq.Ft</span>


            </span>
            <span style={{ fontFamily: "SF Pro Display", fontSize: "14px" }}>
              (5.0)
              <img src='images/icons/Star 6.png' alt="wish-icone" className='wish-icone' s />
            </span>


          </p>
          <div className="Size-container">
            <p ><strong >Category:</strong></p>
            <div id="spaceContainer" className="space-box-container">
              {spaces.length > 0 ? (
                spaces.map((space, index) => (
                  <div key={index} className="text-style">{space}</div>
                ))
              ) : (
                <p>No Space Available</p>
              )}
            </div>
          </div>
          <hr />
          <p className="About">
            <strong>About:</strong><br />
            <span className='text-style'>{product.shortDescription || "-"}</span>
          </p>
          <hr />
          <div className="Size-container" >
            <p><strong>Size:</strong></p>
            <div id="sizeContainer" className="space-box-container">
              {sizesArray.length > 0 ? (
                sizesArray.map((size, index) => (
                  <div
                    key={index}
                    className={`text-style2 ${selectedSize === size ? 'selected' : ''}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSizeSelection(size)}
                  >
                    {size}
                  </div>
                ))
              ) : (
                <p>No Sizes Available</p>
              )}
            </div>
          </div>
          <div className="Thickness-container">
            <div className="Size-container" >
              <p><strong>Thickness:</strong></p>
              <div id="thicknessContainer" className="space-box-container">
                {thicknessArray.length > 0 ? (
                  thicknessArray.map((thickness, index) => (
                    <div
                      key={index}
                      className={`text-style ${selectedThickness === thickness ? 'selected' : ''}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleThicknessSelection(thickness)}
                    >
                      {thickness}
                    </div>
                  ))
                ) : (
                  <p>No Thickness Available</p>
                )}
              </div>
            </div>
            <p className='finish' >
              <strong>Finish:</strong> <span className='text-style'>{Array.isArray(product.finish) ? product.finish.join(', ') : (product.finish || "No Finish")}</span>
            </p>
          </div>
          <div className="Size-container">
            <p><strong>Space:</strong></p>
            <div id="categoryContainer">
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <div
                    key={index}
                    className={`category-button  ${selectedCategoryIndex === index ? 'selected' : ''}`}


                    onClick={() => setSelectedCategoryIndex(index)}
                  >
                    {category}
                  </div>
                ))
              ) : (
                <p>No Categories Available</p>
              )}
            </div>
          </div>


          <p style={{ display: "none" }}><strong>Brand:</strong> <span>{product.Brand || "-"}</span></p>
          <div className="buttons-container">
            <button id="BookNow" onClick={() => handleBookSample(product)}>
              Book a Sample
            </button>


            <button onClick={handleAddToGallery} id="AddToCart">Add to Cart</button>
          </div>
          <button id="buyNow" style={{ display: "none" }} >
            Buy Now - <span id="selectedPrice">{currentPrice}</span>
          </button>
          <div className="product-details-contact" style={{ fontFamily: "SF Pro Display", fontSize: "12px" }}>
            <p style={{ fontWeight: "400", color: "#2F2F2F", fontstyle: "normal", marginLeft: "-5px" }}>Call for Quotation : +91 9871400020</p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
              <img src='images/icons/fi_1077042.png' alt="contact-icone" className='contact-icone' />
              <img src='images/icons/fi_739237.png' alt="contact-icone" className='contact-icone' />
              <img src='images/icons/Layer_1.png' alt="contact-icone" className='contact-icone' />
              <img src='images/icons/fi_1384095.png' alt="contact-icone" className='contact-icone' />
            </div>
          </div>
        </div>
      </div>

      {/* Second-part: Tabbed Section */}
      <div className="Second-part">
        <div className="Header-section">
          <span
            className={activeTab === "Product Images" ? "active" : ""}
            onClick={() => setActiveTab("Product Images")}
          >
            Product Images
          </span>
          <span
            className={activeTab === "Technical Info" ? "active" : ""}
            onClick={() => setActiveTab("Technical Info")}
          >
            Technical Info
          </span>
          <span
            className={activeTab === "Review" ? "active" : ""}
            onClick={() => setActiveTab("Review")}
          >
            Review
          </span>
        </div>
        <div className="tab-content">
          {activeTab === "Product Images" && (
            <>
              {product.tileImage && product.tileImage.length > 0 ? (
                <img
                  src={product.tileImage[0]}
                  alt="Tile"
                  className="tab-image"
                  onClick={() => window.location.href = product.tileImage[0]}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <p>No Tile Image available.</p>
              )}
            </>
          )}


          {activeTab === "Technical Info" && (
            <>
              {product.technicalImage && product.technicalImage.length > 0 ? (
                <img
                  src={product.technicalImage[0]}
                  alt="Technical"
                  className="tab-image-1"
                  onClick={() => window.location.href = product.technicalImage[0]}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <p>No Technical Info available.</p>
              )}
            </>
          )}
          {activeTab === "Review" && (
            <>


              <form className="review-form">
                <div className="review-form-header">


                  <input type="text" name="name" placeholder="Your Name" />




                  <input type="email" name="email" placeholder="Your Email" />


                </div>
                <div>




                  <textarea className='text-area' name="message" placeholder="Your Review" ></textarea>
                </div>
                <button type="submit">Submit</button>
              </form>
            </>




          )}
        </div>
      </div>
      <div className="similar-products-section">
  <h2 className="similar-products-header">Similar Products</h2>

  {similarProducts && similarProducts.length > 0 ? (
    <div className="similar-products-list">
      {similarProducts.map((product, index) => (
        <div
          key={index}
          className="similar-product-card"
          onClick={() =>
            (window.location.href = `product-details?id=${product.product_id}`)
          }
        >
          <div className="similar-product-image-wrapper">
            <img src={product.image} alt={`Product ${index + 1}`} />
            <button className="wishlist-button">♡</button>
          </div>

          <p className="product-price">
            <span className="price-green">₹{product.price}</span>
            <span className="price-unit"> /Sq.ft.</span>
          </p>

          <p className="product-name">{product.name}</p>

          <button className="btn-dark">Buy Now</button>
          <button className="btn-outline" onClick={handleAddToGallery}>Add to Cart</button>
        </div>
      ))}
    </div>
  ) : (
    <p>No similar products available.</p>
  )}
</div>

 



      <Footer />
    </>
  );
};

export default ProductDetails;



