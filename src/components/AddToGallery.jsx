import React, { useEffect, useState } from 'react';
import './Cart.css';
import { Minus, Plus, Trash2, Heart, ArrowLeft } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import DeliveryAddress from './DeliveryAddress';
import BillingAddressForm from './BillingAddressForm';
import emailjs from 'emailjs-com';

const OrderSummary = ({ subtotal }) => {
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
          <strong>₹{total.toLocaleString()}</strong>
        </div>
        <button className="checkout-btn">Checkout</button>
      </div>

      <div className="order-note-box">
        <h4>Note</h4>
        <ul>
          <li><strong>30%</strong> advance payment is required before purchasing any product, with the remaining <strong>70%</strong> payable upon delivery.</li>
          <li>For sample bookings, full payment will be required.</li>
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

  useEffect(() => {
    const storedGallery = JSON.parse(localStorage.getItem("galleryCart")) || [];
    const enrichedGallery = storedGallery.map(item => ({
      ...item,
      quantity: item.quantity || 1,
      price: Number(item.price) || 250
    }));
    setCartItems(enrichedGallery);
  }, []);

  const getFirstImage = (images) => {
    if (Array.isArray(images)) return images[0];
    return images;
  };

  const renderArray = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    return value || 'N/A';
  };

  const handleAddAddressClick = () => {
    setShowAddressForm(true);
  };

  const handleSendOtpClick = () => {
    setOtpSent(true);
  };

  const formatCartItems = () => {
    return cartItems.map(item => {
      const name = item.name || 'Unnamed';
      const size = item.selectedSize || 'N/A';
      const thickness = item.selectedThickness || 'N/A';
      return `${name} (Size: ${size}, Thickness: ${thickness})`;
    }).join('\n');
  };

  const handleQuantityChange = (index, delta) => {
    setCartItems(prevItems => {
      return prevItems.map((item, i) => {
        if (i === index) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      });
    });
  };

  const handleSendCartEmail = (customerEmail) => {
    const cartData = formatCartItems();

    if (!customerEmail) {
      alert('Customer email is missing. Cannot send mail.');
      return;
    }

    const confirmation = window.confirm(`Send cart details to ${customerEmail}?`);
    if (!confirmation) return;

    emailjs.send(
      'service_t16t4rm',
      'template_wrw99ho',
      {
        email: customerEmail,
        order_id: cartData
      },
      'GhP9dcQ5K80SP8IVO'
    )
    .then(response => {
      console.log('Email sent successfully:', response);
      alert('Email sent successfully to ' + customerEmail);
      setShowRazorpay(true);
    })
    .catch(error => {
      console.error('Failed to send email:', error);
      alert('Email sending failed. Error details: ' + error.text);
    });
  };

  const handlePayment = () => {
    alert("Razorpay payment initiated!");
    setOrderPlaced(true);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (orderPlaced) {
    return (
      <div className="order-success">
        <h2>Order Placed Successfully!</h2>
        <p>A confirmation email has been sent to your registered email address.</p>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className='column-cart'>
        <div className="simple-cart-wrapper">
          <div className="simple-header">
            <ArrowLeft size={20} className="back-arrow" />
            <h2>Shopping Cart</h2>
            <button className="add-address-btn" onClick={handleAddAddressClick}>
              Add Address
            </button>
          </div>

          {otpSent ? (
            <BillingAddressForm onCheckout={handleSendCartEmail} />
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
                      <img src={getFirstImage(item.tileImage)} alt={item.name} className="simple-item-img" />
                      <div>
                        <div className="simple-item-title">{item.name}</div>
                        {item.sample && <div className="simple-item-sub">Sample</div>}
                        <div className="simple-item-desc">Size: {item.selectedSize || 'N/A'}</div>
                        <div className="simple-item-desc">Thickness: {item.selectedThickness || 'N/A'}</div>
                        <div className="simple-item-desc">Category: {renderArray(item.space)}</div>
                      </div>
                    </div>

                    <div className="simple-item-actions">
                      <div className="simple-item-price">₹{item.price * item.quantity}</div>
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
                ))
              )}
            </div>
          )}
        </div>

        <div className='cart-column-order'>
          <OrderSummary subtotal={subtotal} />
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
