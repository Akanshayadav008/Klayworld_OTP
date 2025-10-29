import React, { useEffect } from "react";
import "../components/Blog1.css";
import Header from "./Header";
import Footer from "./Footer";

const Blog2 = () => {

  // Scroll to the top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="blog-container">
        <img 
          src="/images/blog1.jpeg" 
          alt="Tile Blog Banner" 
          className="blog-banner"
        />
        <div className="blog-content">
          <h2 className="blog-title">The future of tiles</h2>
          <p className="blog-date">12th April, 2022</p>
          <p className="blog-text">"Start with a great tile, and the rest will fall into place."</p>

          <p className="blog-text">
          Tiles have been subject to continuous evolution for a very long time. In India, the tile industry primarily came into existence only in the 13th century and ever since then, the industry has constantly been evolving.
          </p>
          <p className="blog-text">This change and increase in demand push the tile industry to evolve and shapeshift. There are a few characteristics in the ceramic industry which is the base of what influences tiles today. Not just that, the tile industry, like any other, has also been adopting technological advancements.</p>

          <p className="blog-text">The Aesthetics:</p>
         <p className="blog-text">The industry has come way ahead in this regard, from ceramic tiles that vary in their gloss, sheen and texture with an array of colors to choose from. The future trend of ceramics is predicted to be simple, minimal colored in light shades. Bold hues of yellows, greens and blues are also expected to be the sensation. Another trend that can be defined as the future of tile trends is extra-large ceramic tile slabs. With the introduction of 3D printing in the tile industry, designs are constantly evolving and changing. Unlike the natural marble stone, these porcelain imitators are not just non-porous, but they are also low maintenance. Hence a shift of people using tiles more than marble and stones can be observed over the last few years. Not just that, the ceramic industry plays a very predominant role in the Interior designing sector. With tiles becoming a trendsetter, ceramic tiles are being preferred instead of ordinary paints or any other material.</p>
         <p className="blog-text">Progress in porosity and strength</p>

         <p className="blog-text">Porosity is another characteristic of tiles that has seen a lot of change. From 1985, Spartek started producing tiles with a porosity of 6 to 7%. With the technological advancements that came along the way, companies have begun producing tiles with a porosity of less than 0.05%.</p>

         <p className="blog-text">The influence of technological development and digital shift on tiles today</p>
         <p className="blog-text">Artificial intelligence, Virtual Reality and Augmented Reality have been growing rapidly, and the tiling industry has also been influenced by it. The future ceramic sectors will be able to optimize these technological advancements and present the end result while shopping to the customers in a more realistic manner.</p>
         
         <p className="blog-text">Inkjet tile decoration</p>
         <p className="blog-text">Inkjet decoration machines not only fit perfectly into glazing lines and improve efficiency. With up to 1000 nozzles, working with six different inks, and up to 1000 dpi resolution, the precision achieved is impressive. This ceramic technology is also constantly evolving. There is excellent potential for it in the future to create the exact replica of drawings, natural stones, cuts, pictures and many more.</p>
         <p className="blog-text">What does tile shopping look like today?</p>
         
         <p className="blog-text">Today a customer's intentionality to choose a tile is not solely based on aesthetic characteristics or any characteristic of physical nature but also based on quality. Comparing the statistics of customers in the year 2010 up until now, nearly 68 percent of customers have moved online and prefer shopping online. Hence the tile industry has also adapted to the shift and moved to online mediums.</p>
        
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

export default Blog2;
