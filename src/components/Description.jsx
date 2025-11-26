// src/components/ProductDetails.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from './../../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  collection,
  onSnapshot, // added
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // added
import './Description.css';
import Header from './Header';
import Footer from './Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductDetails = () => {
  // State for fetched product data
  const [product, setProduct] = useState(null);
  // For switching main image/category
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  // Variation selections
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedThickness, setSelectedThickness] = useState(null);
  const [currentPrice, setCurrentPrice] = useState('₹0.00');
  // New state for the tab in second part
  const [activeTab, setActiveTab] = useState('Product Images');

  const collectionName = 'products';
  const queryParams = new URLSearchParams(window.location.search);
  const productId = queryParams.get('id');
  const [similarProducts, setSimilarProducts] = useState([]);

  // ---- Added: auth + booked-state
  const [currentUser, setCurrentUser] = useState(null);
  const [isSampleBooked, setIsSampleBooked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // helpers (added)
  const normalizeId = (item) => {
    const raw = item?.id ?? item?.product_id ?? item?.pid ?? null;
    if (Array.isArray(raw)) return raw[0] ?? '';
    return raw ?? '';
  };
  const isTrue = (v) => v === true || v === 'true' || v === 1 || v === '1';

  // Live-check if sample is booked (subscribe to user's cart)
  useEffect(() => {
    if (!currentUser || !product?.product_id) {
      setIsSampleBooked(false);
      return;
    }

    const cartRef = doc(db, 'carts', currentUser.uid);
    const unsub = onSnapshot(
      cartRef,
      (snap) => {
        if (!snap.exists()) {
          setIsSampleBooked(false);
          return;
        }
        const items = Array.isArray(snap.data().items) ? snap.data().items : [];
        const exists = items.some(
          (it) => String(normalizeId(it)) === String(product.product_id) && isTrue(it?.sample)
        );
        setIsSampleBooked(exists);
      },
      (err) => {
        console.error('onSnapshot carts error:', err);
        setIsSampleBooked(false);
      }
    );

    return () => unsub();
  }, [currentUser, product?.product_id]);
  // ---- /Added

  // Fetch similar products whenever product changes
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product || !product.space) return;

      try {
        const q = query(
          collection(db, 'products'),
          where('space', '==', product.space),
          where('name', '!=', product.name),
          limit(3)
        );

        const querySnapshot = await getDocs(q);
        const similar = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          similar.push({
            product_id: d.id, // ensure navigation works
            ...data,
          });
        });
        setSimilarProducts(similar);
      } catch (error) {
        console.error('Error fetching similar products:', error);
        toast.error('Could not load similar products.');
      }
    };

    if (product) {
      fetchSimilarProducts();
    }
  }, [product]);

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
            const sizesSet = new Set();
            productData.variation.forEach((variation) => {
              variation.size.forEach((s) => sizesSet.add(s.name));
            });
            const sizeArray = Array.from(sizesSet);
            if (sizeArray.length > 0) {
              setSelectedSize(sizeArray[0]);
              const thicknessSet = new Set();
              productData.variation.forEach((variation) => {
                variation.size.forEach((s) => {
                  if (s.name === sizeArray[0]) {
                    thicknessSet.add(s.thickness || productData.thickness || 'Default');
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
          console.error('No such document');
          toast.error('Product not found.');
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to load product details.');
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Function to update price based on selection
  const updatePrice = (size, thickness, productData) => {
    let price = '₹0.00';
    (productData?.variation || []).forEach((variation) => {
      variation.size.forEach((s) => {
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
      const thicknessSet = new Set();
      product.variation.forEach((variation) => {
        variation.size.forEach((s) => {
          if (s.name === size) {
            thicknessSet.add(s.thickness || product.thickness || 'Default');
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

  // Add to gallery (localStorage)
  const handleAddToGallery = (item) => {
    const base = item || product;
    if (!base) return;

    if (!base.vendor_id || base.vendor_id.length === 0) {
      toast.error('This product is not available.');
      return;
    }

    const selectedProduct = {
      id: base.product_id || '',
      name: base.name || '',
      price: currentPrice || '',
      selectedSize: selectedSize || '',
      selectedThickness: selectedThickness || '',
      space: base.space || [],
      vendor_id: base.vendor_id || [],
      tileImage: base.tileImage?.[0] || '',
      sample: true,
      quantity: 1,
      bookedAt: new Date().toISOString(),
    };

    let galleryCart = JSON.parse(localStorage.getItem('galleryCart')) || [];

    const isAlreadyInCart = galleryCart.some((it) => {
      const gid = Array.isArray(it.id) ? it.id[0] : it.id;
      return String(gid) === String(selectedProduct.id);
    });
    if (isAlreadyInCart) {
      toast.warning('Product is already added to the gallery.');
      return;
    }

    galleryCart.push(selectedProduct);
    localStorage.setItem('galleryCart', JSON.stringify(galleryCart));

    toast.success('Product added to gallery!');
  };

  // Book sample to Firestore cart (UNCHANGED)
  const handleBookSample = async () => {
    const user = auth.currentUser;

    if (!user) {
      toast.info('Please sign in first to book a sample.');
      return;
    }

    const selectedProduct = {
      id: product?.product_id || '',
      name: product?.name || '',
      price: currentPrice || '',
      selectedSize: selectedSize || '',
      selectedThickness: selectedThickness || '',
      space: product?.space || [],
      vendor_id: product?.vendor_id || [],
      tileImage: product?.tileImage?.[0] || '',
      sample: true,
      quantity: 1,
      bookedAt: new Date().toISOString(),
    };

    try {
      const cartRef = doc(db, 'carts', user.uid);
      const cartSnap = await getDoc(cartRef);

      let existingItems = [];
      if (cartSnap.exists()) {
        const data = cartSnap.data();
        existingItems = Array.isArray(data.items) ? data.items : [];
      }

      const alreadyExists = existingItems.some(
        (item) =>
          String(normalizeId(item)) === String(selectedProduct.id) && isTrue(item.sample)
      );
      if (alreadyExists) {
        toast.warning('Sample is already booked for this product.');
        return;
      }

      existingItems.push(selectedProduct);

      await setDoc(
        cartRef,
        {
          uid: user.uid,
          items: existingItems,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success('Sample booked successfully!');
      // UI will flip via onSnapshot
    } catch (error) {
      console.error('Error saving sample to Firestore:', error);
      toast.error('Failed to save sample. Please try again.');
    }
  };

  if (!product) {
    return (
      <>
        <div>Loading...</div>
        <Footer />
        <ToastContainer position="top-right" />
      </>
    );
  }

  // Prepare dynamic fields
  const categories = product.category ? Object.values(product.category) : [];
  const productImage =
    (product.image && product.image[selectedCategoryIndex]) || 'placeholder.jpg';
  const spaces = product.space && Array.isArray(product.space) ? product.space : [];

  const sizesSet = new Set();
  (product.variation || []).forEach((variation) => {
    variation.size.forEach((s) => sizesSet.add(s.name));
  });
  const sizesArray = Array.from(sizesSet);

  const thicknessSet = new Set();
  if (product.variation && selectedSize) {
    product.variation.forEach((variation) => {
      variation.size.forEach((s) => {
        if (s.name === selectedSize) {
          thicknessSet.add(s.thickness || product.thickness || 'Default');
        }
      });
    });
  }
  const thicknessArray = Array.from(thicknessSet);

  return (
    <>
      <div className="product-container">
        {/* Left: Main Product Image */}
        <div className="product-gallery">
          <img src={productImage} alt="Product" />
        </div>

        {/* Product Thumbnails */}
        <div className="product-thumbnails">
          <div className="small-images">
            {product.image &&
              product.image.map((image, index) => (
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
              <a href={product.meta_view}>
                <img src="images/icons/360 png.png" alt="360 View" className="meta_view" />
              </a>
            ) : (
              '-'
            )}
          </p>
        </div>

        {/* Right: Product Details */}
        <div className="product-details">
          <p className="header-top">
            <span
              style={{ fontStyle: 'normal', fontWeight: 700, fontSize: '28px' }}
            >
              {product.name || 'No Name'}
            </span>
            <img src="images/icons/image 12.png" alt="wish-icone" className="wish-icone" />
          </p>

          <p className="product-price">
            <span>
              <span
                style={{
                  color: '#00BD29',
                  fontFamily: 'SF Pro Display',
                  fontWeight: 500,
                  fontStyle: 'normal',
                }}
              >
                &#8377; {product.price || 'No Price'}{' '}
              </span>
              <span style={{ fontFamily: 'SF Pro Display', fontWeight: 'normal' }}>/Sq.Ft</span>
            </span>
            <span style={{ fontFamily: 'SF Pro Display', fontSize: '14px' }}>
              (5.0)
              <img
                src="images/icons/Star 6.png"
                alt="wish-icone"
                className="wish-icone"
              />
            </span>
          </p>

          <div className="Size-container">
            <p>
              <strong>Category:</strong>
            </p>
            <div id="spaceContainer" className="space-box-container">
              {spaces.length > 0 ? (
                spaces.map((space, index) => (
                  <div key={index} className="text-style">
                    {space}
                  </div>
                ))
              ) : (
                <p>No Space Available</p>
              )}
            </div>
          </div>

          <hr />

          <p className="About">
            <strong>About:</strong>
            <br />
            <span className="text-style">{product.shortDescription || '-'}</span>
          </p>

          <hr />

          <div className="Size-container">
            <p>
              <strong>Size:</strong>
            </p>
            <div id="sizeContainer" className="space-box-container">
              {sizesArray.length > 0 ? (
                sizesArray.map((size, index) => (
                  <div
                    key={index}
                    className={`text-style2 ${selectedSize === size ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
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
            <div className="Size-container">
              <p>
                <strong>Thickness:</strong>
              </p>
              <div id="thicknessContainer" className="space-box-container">
                {thicknessArray.length > 0 ? (
                  thicknessArray.map((thickness, index) => (
                    <div
                      key={index}
                      className={`text-style ${selectedThickness === thickness ? 'selected' : ''}`}
                      style={{ cursor: 'pointer' }}
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

            <p className="finish">
              <strong>Finish:</strong>{' '}
              <span className="text-style">
                {Array.isArray(product.finish)
                  ? product.finish.join(', ')
                  : product.finish || 'No Finish'}
              </span>
            </p>
          </div>

          <div className="Size-container">
            <p>
              <strong>Space:</strong>
            </p>
            <div id="categoryContainer">
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <div
                    key={index}
                    className={`category-button ${
                      selectedCategoryIndex === index ? 'selected' : ''
                    }`}
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

          <p style={{ display: 'none' }}>
            <strong>Brand:</strong> <span>{product.Brand || '-'}</span>
          </p>

          <div className="buttons-container">
            {/* Dynamic label/disabled; book handler unchanged */}
            <button
              id="BookNow"
              onClick={handleBookSample}
              disabled={isSampleBooked}
              style={isSampleBooked ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {isSampleBooked ? 'Sample added' : 'Book a Sample'}
            </button>

            <button id="AddToCart" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              Add to Cart
            </button>
          </div>

          <button id="buyNow" style={{ display: 'none' }}>
            Buy Now - <span id="selectedPrice">{currentPrice}</span>
          </button>

          <div className="product-details-contact" style={{ fontFamily: 'SF Pro Display', fontSize: '12px' }}>
            <p style={{ fontWeight: 400, color: '#2F2F2F', fontStyle: 'normal', marginLeft: '-5px' }}>
              Call for Quotation : +91 9871400020
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              <img src="images/icons/fi_1077042.png" alt="contact-icone" className="contact-icone" />
              <img src="images/icons/fi_739237.png" alt="contact-icone" className="contact-icone" />
              <img src="images/icons/Layer_1.png" alt="contact-icone" className="contact-icone" />
              <img src="images/icons/fi_1384095.png" alt="contact-icone" className="contact-icone" />
            </div>
          </div>
        </div>
      </div>

      {/* Second-part: Tabbed Section */}
      <div className="Second-part">
        <div className="Header-section">
          <span className={activeTab === 'Product Images' ? 'active' : ''} onClick={() => setActiveTab('Product Images')}>
            Product Images
          </span>
          <span className={activeTab === 'Technical Info' ? 'active' : ''} onClick={() => setActiveTab('Technical Info')}>
            Technical Info
          </span>
          <span className={activeTab === 'Review' ? 'active' : ''} onClick={() => setActiveTab('Review')}>
            Review
          </span>
        </div>

        <div className="tab-content">
          {activeTab === 'Product Images' && (
            <>
              {product.tileImage && product.tileImage.length > 0 ? (
                <img
                  src={product.tileImage[0]}
                  alt="Tile"
                  className="tab-image"
                  onClick={() => (window.location.href = product.tileImage[0])}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <p>No Tile Image available.</p>
              )}
            </>
          )}

          {activeTab === 'Technical Info' && (
            <>
              {product.technicalImage && product.technicalImage.length > 0 ? (
                <img
                  src={product.technicalImage[0]}
                  alt="Technical"
                  className="tab-image-1"
                  onClick={() => (window.location.href = product.technicalImage[0])}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <p>No Technical Info available.</p>
              )}
            </>
          )}

          {activeTab === 'Review' && (
            <>
              <form className="review-form" onSubmit={(e) => e.preventDefault()}>
                <div className="review-form-header">
                  <input type="text" name="name" placeholder="Your Name" />
                  <input type="email" name="email" placeholder="Your Email" />
                </div>
                <div>
                  <textarea className="text-area" name="message" placeholder="Your Review"></textarea>
                </div>
                <button type="submit">Submit</button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Similar Products */}
      <div className="similar-products-section">
        <h2 className="similar-products-header">Similar Products</h2>

        {similarProducts && similarProducts.length > 0 ? (
          <div className="similar-products-list">
            {similarProducts.map((p, index) => (
              <div
                key={index}
                className="similar-product-card"
                onClick={() => (window.location.href = `product-details?id=${p.product_id}`)}
              >
                <div className="similar-product-image-wrapper">
                  <img
                    src={
                      Array.isArray(p.image) ? p.image[0] :
                      p.image || p.tileImage?.[0] || 'placeholder.jpg'
                    }
                    alt={`Product ${index + 1}`}
                  />
                  <button
                    className="wishlist-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToGallery(p);
                    }}
                  >
                    ♡
                  </button>
                </div>

                <p className="product-price">
                  <span className="price-green">₹{p.price}</span>
                  <span className="price-unit"> /Sq.ft.</span>
                </p>

                <p className="product-name">{p.name}</p>

                <button
                  className="btn-dark"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `product-details?id=${p.product_id}`;
                  }}
                >
                  Buy Now
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToGallery(p);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No similar products available.</p>
        )}
      </div>

      <Footer />
      {/* Toasts (keep one globally if you prefer) */}
      <ToastContainer position="top-right" />
    </>
  );
};

export default ProductDetails;
