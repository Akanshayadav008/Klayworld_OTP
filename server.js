const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // Your Gmail
    pass: process.env.EMAIL_PASS      // App password
  },
});
app.post("/send-success-email", async (req, res) => {
  const { customerEmail, deliveryData, cartItems = [], subtotal = 0 } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || "deepanshurao68@gmail.com";
  const delivery = 20;
  const total = subtotal + delivery;

  // 1️⃣ 🎉 Email to Customer
  const customerMail = {
    from: `"Klay World" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: "🎉 Order Placed Successfully!",
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order is confirmed. We’ll notify you once it's shipped.</p>
      <p>📞 Support: +91-9998333033</p>
    `,
  };

  // 2️⃣ 📦 Email to Admin (use your formatted template)
  const adminMail = {
    from: `"Klay World" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "📦 New Order Placed - Klay World",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto;">
        <h2 style="color: #333;">Order Summary</h2>
        <p><strong>Customer Name:</strong> ${deliveryData?.firstName || "N/A"} ${deliveryData?.lastName || ""}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${deliveryData?.contact || "N/A"}</p>
        <p><strong>Address:</strong> ${deliveryData?.houseNumber || ""}, ${deliveryData?.landmark || ""}, 
          ${deliveryData?.city || ""}, ${deliveryData?.state || ""}, ${deliveryData?.pincode || ""}, ${deliveryData?.country || ""}</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ccc; padding: 8px;">Product</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Size</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Thickness</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Qty</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Sqft</th>
              <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${
              cartItems.map(item => {
                const sqft = item.sqftPerUnit ? (item.quantity * item.sqftPerUnit).toFixed(2) : "N/A";
                const price = item.price && item.quantity && item.sqftPerUnit
                  ? `₹${(item.price * item.quantity * item.sqftPerUnit).toLocaleString()}`
                  : "₹N/A";
                return `
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${item.name || "N/A"}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${item.selectedSize || "N/A"}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${item.selectedThickness || "N/A"}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${item.quantity || "N/A"}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${sqft}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${price}</td>
                  </tr>`;
              }).join("")
            }
          </tbody>
        </table>

        <p style="margin-top: 20px;"><strong>Subtotal:</strong> ₹${subtotal.toLocaleString()}</p>
        <p><strong>Delivery:</strong> ₹${delivery}</p>
        <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
        <p style="margin-top: 15px;">📞 Support: +91-9998333033</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(customerMail);
    await transporter.sendMail(adminMail);
    res.status(200).json({ success: true, message: "Emails sent" });
  } catch (error) {
    console.error("❌ Email error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
