import React, { useEffect, useState } from "react";
import "./Cart.css";
import { Minus, Plus, Trash2, Heart, ArrowLeft } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import DeliveryAddress from "./DeliveryAddress";
import BillingAddressForm from "./BillingAddressForm";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebaseConfig"; // ✅ correct path
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const OrderSummary = ({ subtotal, onCheckout }) => {
  const delivery = 20;
  const discount = 0;
  const total = subtotal + delivery - discount;

  return (
    <div className="order-summary-container">
      <div className="order-summary-box">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>Delivery Charges</span>
          <span>₹{delivery}</span>
        </div>
        <div className="summary-row">
          <span>Discount</span>
          <span>--</span>
        </div>
        <hr />
        <div className="summary-row total">
          <strong>Total Amount</strong>₹{total.toLocaleString()}
        </div>
        <button className="checkout-btn" onClick={onCheckout}>
          Checkout
        </button>
      </div>

      <div className="order-note-box">
        <h4>Note</h4>
        <ul>
          <li>
            <strong>30%</strong> advance payment is required before purchasing
            any product.
          </li>
          <li>
            Remaining <strong>70%</strong> is payable upon delivery.
          </li>
          <li>For sample bookings, full payment is required.</li>
        </ul>
      </div>
    </div>
  );
};

const AddToGallery = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch cart data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
          const data = cartSnap.data();
          const items = data.items || [];
          console.log("✅ Fetched cart items:", items);
          setCartItems(items);
        } else {
          console.log("🛒 No cart found for this user.");
        }
      } catch (error) {
        console.error("❌ Error fetching cart from Firestore:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Delete an item from Firebase + local state
  const handleDeleteItem = async (index) => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Please log in first.");

      const cartRef = doc(db, "carts", user.uid);
      const updatedCart = [...cartItems];
      updatedCart.splice(index, 1);

      await updateDoc(cartRef, { items: updatedCart });
      setCartItems(updatedCart);

      console.log("🗑️ Item deleted successfully.");
    } catch (error) {
      console.error("❌ Error deleting item:", error);
    }
  };

  const getFirstImage = (images) =>
    Array.isArray(images) ? images[0] : images;
  const renderArray = (value) =>
    Array.isArray(value) ? value.join(", ") : value || "N/A";

  const handleAddAddressClick = () => setShowAddressForm(true);

  const handleQuantityChange = (index, delta) => {
    setCartItems((prevItems) => {
      const updated = prevItems.map((item, i) => {
        if (i === index) {
          const newQty = Math.max((item.quantity || 1) + delta, 1);
          return { ...item, quantity: newQty };
        }
        return item;
      });

      // ✅ Update Firestore with new quantities
      const user = auth.currentUser;
      if (user) {
        const cartRef = doc(db, "carts", user.uid);
        updateDoc(cartRef, { items: updated });
      }

      return updated;
    });
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number((item.price || "0").replace(/[₹,]/g, ""));
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const handleCheckout = () => {
    if (!showAddressForm && !otpSent) {
      setShowAddressForm(true);
    }
  };

  const handlePayment = () => {
    alert("Razorpay payment initiated!");
    localStorage.setItem("galleryCart", JSON.stringify(cartItems));
    localStorage.setItem("subtotal", subtotal);
    setOrderPlaced(true);
    navigate("/order-success");
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading your cart...
      </p>
    );
  }

  if (orderPlaced) {
    return (
      <div className="order-success">
        <h2>Order Placed Successfully!</h2>
        <p>A confirmation email will be sent to your registered email address.</p>
      </div>
    );
  }

  return (
    <>
      <div className="column-cart">
        <div className="simple-cart-wrapper">
          <div className="simple-header">
            <ArrowLeft
              size={20}
              className="back-arrow"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(-1)}
            />
            <h2>Shopping Cart</h2>
            {!showAddressForm && !otpSent && (
              <button
                className="add-address-btn"
                onClick={handleAddAddressClick}
              >
                Add Address
              </button>
            )}
          </div>

          {otpSent ? (
            <BillingAddressForm onCheckout={() => setShowRazorpay(true)} />
          ) : showAddressForm ? (
            <DeliveryAddress />
          ) : (
            <div className="simple-cart-items">
              {cartItems.length === 0 ? (
                <p>No items in the cart.</p>
              ) : (
                cartItems.map((item, idx) => (
                  <div className="simple-cart-item" key={idx}>
                    <div className="simple-item-info">
                      <img
                        src={getFirstImage(item.tileImage)}
                        alt={item.name}
                        className="simple-item-img"
                      />
                      <div>
                        <div className="simple-item-title">{item.name}</div>
                        {item.sample ? (
                          <div className="sample-label">Sample</div>
                        ) : (
                          <div className="box-label">Box</div>
                        )}
                        <div className="simple-item-desc">
                          Size: {item.selectedSize || "N/A"}
                        </div>
                        <div className="simple-item-desc">
                          Thickness: {renderArray(item.selectedThickness)}
                        </div>
                        <div className="simple-item-desc">
                          Category: {renderArray(item.space)}
                        </div>
                      </div>
                    </div>

                    <div className="simple-item-actions">
                      <div className="simple-item-price">Rs 0</div>
                      <div className="simple-qty-ctrl">
                        <button onClick={() => handleQuantityChange(idx, -1)}>
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button onClick={() => handleQuantityChange(idx, 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="simple-icons">
                        <Heart size={16} />
                        <Trash2
                          size={16}
                          style={{ cursor: "pointer", marginLeft: "10px" }}
                          onClick={() => handleDeleteItem(idx)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="cart-column-order">
          <OrderSummary subtotal={subtotal} onCheckout={handleCheckout} />
        </div>
      </div>

      {showRazorpay && (
        <div className="razorpay-container">
          <h2>Proceed with Payment</h2>
          <button onClick={handlePayment} className="razorpay-btn">
            Pay with Razorpay
          </button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default AddToGallery;
