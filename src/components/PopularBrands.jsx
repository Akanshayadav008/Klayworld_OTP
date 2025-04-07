import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "../components/PopularBrands.css"; // Ensure this CSS file exists

const brands = [
  { image: "images/italgraniti.webp", name: "Lamborghini" },
  { image: "images/appiani.png", name: "Appiani" },
  { image: "images/bisazza.png", name: "Bisazza" },
  { image: "images/emil.png", name: "Emil Ceramica" },
  { image: "images/nexion.png", name: "Nexio" },
  { image: "images/lamborghini.png", name: "Lamborghini" },
  { image: "images/Marca.png", name: "Lamborghini" },
  { image: "images/ariostea.png", name: "Marca" },
];


const PopularBrands = () => {
  return (
    <div className="brands-section">
      <h2 className="brands-title">
        <span className="line"></span> Our Popular Brands <span className="line"></span>
      </h2>
      
      <Swiper
        spaceBetween={30}
        slidesPerView={5}
        loop={true}
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        modules={[Autoplay]}
        className="brands-slider"
      >
        {brands.map((brand, index) => (
          <SwiperSlide key={index} className="brand-slide">
            <img src={brand.image} alt={brand.name} className="brand-logo" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PopularBrands;
