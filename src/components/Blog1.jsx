import React, { useEffect } from "react";
import "../components/Blog1.css";
import Header from "./Header";
import Footer from "./Footer";

const Blog1 = () => {

  // Scroll to the top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="blog-container">
        <img 
          src="/images/blog3.jpeg" 
          alt="Tile Blog Banner" 
          className="blog-banner"
        />
        <div className="blog-content">
          <h2 className="blog-title">What type of tile fits where?</h2>
          <p className="blog-date">12th April, 2022</p>
          <p className="blog-text">"Start with a great tile, and the rest will fall into place."</p>

          <p className="blog-text">
          Tiles are one of the determinants of the aesthetics of a room. The process of tile selection doesn't involve random picking of colors, but a careful understanding of spatial dimensions and skill for visualizing what suits best is necessary.
          </p>
          <p className="blog-text">Therefore, when installing tiles in your home, choose those that bring up the aesthetic appeal while providing functionality. It would help if you considered which tile fits where before installing them. Here is a guide to help you select the right tile:</p>

          <h3 className="section-title">A) Tiles for your Hall</h3>
          <p className="blog-text">
          Hallways are the prime hub of first introductions and social gatherings. It is also the place that creates first impressions. Therefore, it is a place where the aesthetics and functionality need to be balanced.
          </p>
         <p className="blog-text">A few prominent options you could try include-</p>
         <p className="blog-text">Porcelain tiles: If your choice is leaning towards a contemporary style, then you should go for porcelain tiles. These tiles have the ability to emulate natural stone, wood or bricks while being easy to maintain. They give an elegant finish and also possess excellent durability.</p>

         <p className="blog-text">Ceramic tiles: Ceramic tiles are the most widely used tiles found in every house. Due to their low porosity, they are easy to install and maintain.</p>

         <p className="blog-text">Vinyl tiles: These are substantially unbreakable, which is why it is recommended for hallways where maximum traffic is expected.</p>
         <p className="blog-text">Laminate tiles: These bring out a traditional appearance to your living room.</p>

          <h3 className="section-title">B) Tiles for your Kitchen</h3>
          <p className="blog-text">We have all been caught up in situations where a bubbling hot pot is spilled over. In such cases, having stain-resistant tiles that are easy to clean comes as a huge advantage. Since it is one of the most challenging places in the house for maintenance, here are a few tiles you could consider –</p>
          <p className="blog-text">Ceramic tiles: Glazed ceramic tiles are better to tackle stains; therefore are a popular choice.</p>
          <p className="blog-text">Backsplash tiles: These tiles are not only functional but also visually appealing. They can be made of glass, mosaic tiles, or metallic tiles and can protect your walls from splashes and spills.</p>

          <h3 className="section-title">C) Tiles for Bathroom</h3>
          <p className="blog-text">A bathroom is a place where humidity is a common occurrence. Hence the tiles you install should be moisture resistant to avoid slips and accidents. So since Ceramic tiles are water-resistant, easy to clean and durable, they are one of the most popular choices.</p>

          <h3 className="section-title">D) Tiles for Bedroom</h3>
          <p className="blog-text">Bedrooms are spaces that are comparatively easier to maintain; the tiles installed do not have to be hard-wearing. A few options for bedroom tiles are –</p>
          <p className="blog-text">Wooden or marble tile: They provide you with the luxury that you deserve in your bedroom and foster a warm visual appeal. Their rustic and royal vibe always remains a classic.</p>
          <p className="blog-text">Porcelain tiles: These tiles are moisture-resistant and versatile in nature. If you want the functionality aspect in your bedroom too then porcelain tiles would be the most suitable option for you.</p>
          
          <p className="blog-text">Be it wooden, marble, porcelain, ceramic or any other tile, attain quality tiles at reasonable prices. Klay offers all types of resilient, versatile tiles that are a perfect fit for your home.</p>
          
          <div className="button-group">
            <button className="button email">📧</button>
            <button className="button whatsapp">📱</button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Blog1;
