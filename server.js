
const express = require("express");
const cors = require("cors"); // Import the cors package
const sharp = require("sharp");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable cors for all requests
app.use(cors());

// Middleware for JSON parsing
app.use(express.json());

// === Convert to WebP Route ===
app.get("/convertToWebP", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send("Image URL is required.");
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).send("Unable to fetch image.");
    }

    const buffer = await response.buffer();
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 75 })
      .toBuffer();

    res.set("Content-Type", "image/webp");
    res.send(webpBuffer);
  } catch (error) {
    console.error("Error converting image:", error);
    res.status(500).send("Error converting image.");
  }
});

// === Send Order Success Email Route ===
app.post("/send-success-email", async (req, res) => {
  const { to } = req.body;
  
  if (!to) {
    return res.status(400).json({ message: "Email address is required." });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Your Store" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🎉 Order Placed Successfully!",
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your order has been placed successfully. We’ll update you once it’s shipped.</p>
        <p>Need help? Contact us at <strong>+91-9998333033</strong>.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// === Start the Server ===
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


