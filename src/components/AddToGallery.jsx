import React, { useEffect, useState } from 'react';
import './Cart.css';
import { Minus, Plus, Trash2, Heart, ArrowLeft } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import DeliveryAddress from './DeliveryAddress';
import BillingAddressForm from './BillingAddressForm';
import { useNavigate } from 'react-router-dom';

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
          <strong>Total Amount</strong>
          ₹{total.toLocaleString()}
        </div>
        <button className="checkout-btn" onClick={onCheckout}>Checkout</button>
      </div>

      <div className="order-note-box">
        <h4>Note</h4>
        <ul>
          <li><strong>30%</strong> advance payment is required before purchasing any product.</li>
          <li>Remaining <strong>70%</strong> is payable upon delivery.</li>
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
  const navigate = useNavigate();

  useEffect(() => {
    const storedGallery = JSON.parse(localStorage.getItem("galleryCart")) || [];
    const uniqueMap = new Map();

    storedGallery.forEach(item => {
      const price = Number(item.price.replace(/[^0-9.-]+/g, "")) || 0;
      let sqftPerUnit = 1;

      if (item.selectedSize) {
        const sizeStr = item.selectedSize.toLowerCase().replace(/\s/g, '');
        const mmMatch = sizeStr.match(/([\d.]+)x([\d.]+)mm/);
        const ftMatch = sizeStr.match(/^([\d.]+)x([\d.]+)$/);

        if (mmMatch) {
          const widthFt = parseFloat(mmMatch[1]) * 0.00328084;
          const heightFt = parseFloat(mmMatch[2]) * 0.00328084;
          sqftPerUnit = parseFloat((widthFt * heightFt).toFixed(2));
        } else if (ftMatch) {
          const width = parseFloat(ftMatch[1]);
          const height = parseFloat(ftMatch[2]);
          sqftPerUnit = parseFloat(((width * height)/92903.04).toFixed(2));
        }
      }

      const key = `${item.name}-${item.selectedSize}-${item.selectedThickness}-${item.sample ? 'sample' : 'box'}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          ...item,
          price,
          sqftPerUnit,
          quantity: 1
        });
      } else {
        const existingItem = uniqueMap.get(key);
        uniqueMap.set(key, {
          ...existingItem,
          quantity: existingItem.quantity + 1
        });
      }
    });

    setCartItems(Array.from(uniqueMap.values()));
  }, []);

  const getFirstImage = (images) => Array.isArray(images) ? images[0] : images;
  const renderArray = (value) => Array.isArray(value) ? value.join(', ') : value || 'N/A';

  const handleAddAddressClick = () => setShowAddressForm(true);

  const handleQuantityChange = (index, delta) => {
    setCartItems(prevItems =>
      prevItems.map((item, i) => {
        if (i === index) {
          const newQty = item.quantity + delta;
          if (item.sample) {
            return { ...item, quantity: Math.min(Math.max(newQty, 1), 5) };
          }
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  const handlePayment = () => {
    alert("Razorpay payment initiated!");
    // ✅ Save data for OrderSuccess
    localStorage.setItem("galleryCart", JSON.stringify(cartItems));
    localStorage.setItem("subtotal", subtotal);
    setOrderPlaced(true);
    navigate("/order-success");
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const itemSqft = item.quantity * item.sqftPerUnit;
    return acc + (item.price * itemSqft);
  }, 0);

  const handleCheckout = () => {
    if (!showAddressForm && !otpSent) {
      setShowAddressForm(true);
    }
  };

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
      <Header />
      <div className='column-cart'>
        <div className="simple-cart-wrapper">
          <div className="simple-header">
            <ArrowLeft size={20} className="back-arrow" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)} />
            <h2>Shopping Cart</h2>
            {!showAddressForm && !otpSent && (
              <button className="add-address-btn" onClick={handleAddAddressClick}>Add Address</button>
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
                cartItems.map((item, idx) => {
                  const itemSqft = item.quantity * item.sqftPerUnit;
                  const tilesPerBox = 5;
                  const totalPrice = item.sample
                    ? 200 * item.quantity
                    : item.price * itemSqft * tilesPerBox;

                  return (
                    <div className="simple-cart-item" key={idx}>
                      <div className="simple-item-info">
                        <img src={getFirstImage(item.tileImage)} alt={item.name} className="simple-item-img" />
                        <div>
                          <div className="simple-item-title">{item.name}</div>
                          {item.sample ? (
                            <div className="sample-label">Sample</div>
                          ) : (
                            <div className="box-label">Box</div>
                          )}
                          <div className="simple-item-desc">Size: {item.selectedSize}</div>
                          <div className="simple-item-desc">Thickness: {item.selectedThickness}</div>
                          <div className="simple-item-desc">Category: {renderArray(item.space)}</div>
                          {!item.sample && (
                            <>
                              <div className="simple-item-desc">Sqft: {itemSqft} sqft</div>
                              <div className="simple-item-desc">Tiles per box: {tilesPerBox}</div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="simple-item-actions">
                        <div className="simple-item-price">
                          ₹{totalPrice.toLocaleString()}
                          {item.sample ? (
                            <div className="price-note">(₹200 × {item.quantity} samples)</div>
                          ) : (
                            <div className="price-note">(₹{item.price} × {itemSqft} sqft × {tilesPerBox})</div>
                          )}
                        </div>
                        <div className="simple-qty-ctrl">
                          <button onClick={() => handleQuantityChange(idx, -1)}><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(idx, 1)}><Plus size={14} /></button>
                        </div>
                        <div className="simple-icons">
                          <Heart size={16} />
                          <Trash2 size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className='cart-column-order'>
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
