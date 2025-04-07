const express = require("express");
const sharp = require("sharp");
const fetch = require("node-fetch"); // Ensure you have node-fetch v2 installed


const app = express();
const PORT = process.env.PORT || 3000;


app.get("/convertToWebP", async (req, res) => {
  try {
    // Get the image URL from query parameters
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send("Image URL is required.");
    }


    // Fetch the original image using node-fetch
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).send("Unable to fetch image.");
    }
    const buffer = await response.buffer();


    // Convert image to WebP using Sharp with quality setting (adjust as needed)
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 75 })
      .toBuffer();


    // Set the appropriate header and send the converted image
    res.set("Content-Type", "image/webp");
    res.send(webpBuffer);
  } catch (error) {
    console.error("Error converting image:", error);
    res.status(500).send("Error converting image.");
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



