const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: "rzp_test_YYsy1KPyoTws9L",
  key_secret: "rWL14TbNyPuuWqT2EbWwCkUq",
});

app.post("/create-order", async (req, res) => {
  const options = {
    amount: 1000,
    currency: "INR",
    receipt: "receipt#1",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
