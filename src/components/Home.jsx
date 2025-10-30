import React from "react";
import "./Home.css"; // Ensure this file includes all your styles
import Header from "./Header";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faYoutube, faTwitter, faFacebook } from "@fortawesome/free-brands-svg-icons"; 
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import { BookingSection, BlogSection } from "./BookingSection";
import PopularBrands from "./PopularBrands";
import CategoriesSection from "./CategoriesSection";



const HeaderDesign = () => {
  // This handler replicates the original behavior:
  // it prevents the default link action and opens the link in a new tab.
  const handleLinkClick = (e, url) => {
    e.preventDefault();
    window.open(url, "_blank");
  };

  return (
    <>

      <div className="container2">
        <div className="content2">
          <div className="title">
            Find Your Perfect Tile, Search by Image or Text
          </div>
          <div className="description-container">
            <div className="description">
              Discover tiles effortlessly by uploading an image or typing a
              description. It's quick, easy, and tailored to your needs!
            </div>
            <a href="#" className="shop-now-btn">
              SHOP NOW
            </a>
          </div>
        </div>
        <div>
          <div className="social-media">SOCIAL MEDIA</div>
        </div>
      </div>

      <div className="background-section">
        <div className="overlay">
          <div className="button-container">
            <Link to="/ImageSearch" className="link-style">
              <div className="gif-space">
                <div className="Byimage">
                  <span className="icon">
                    <i className="fa-solid fa-image"></i>
                  </span>
                  <span className="button-text">By Image</span>
                </div>
                <img
                  className="gif-image"
                  src="images/gif/image.gif"
                  alt="By Image GIF"
                />
              </div>
            </Link>

            <Link to="/search" className="link-style">
              <div className="gif-space">
                <div className="Bytext">
                  <span className="icon">
                    <i className="fa-solid fa-t"></i>
                  </span>
                  <span className="button-text">By Text</span>
                </div>
                <img
                  className="gif-image"
                  src="images/gif/Bytext.gif"
                  alt="By Text GIF"
                />
              </div>
            </Link>
          </div>
        </div>

        <div className="social-icons">
         <FontAwesomeIcon icon={faInstagram} color="#6C6865" size="2x"/>
         <FontAwesomeIcon icon={faYoutube} color="#6C6865" size="2x"/>
         <FontAwesomeIcon icon={faTwitter} color="#6C6865" size="2x"/>
         <FontAwesomeIcon icon={faFacebook} color="#6C6865" size="2x"/>
        </div>
      </div>

<BookingSection />
 <CategoriesSection />
<BlogSection />
<PopularBrands />
      <Footer />
    </>
  );
};

export default HeaderDesign;
