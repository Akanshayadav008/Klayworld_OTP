import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faPhone,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../components/Header.css";

function Header() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Detect current page

  const handleFinishClick = (finish) => {
    navigate(`/productsearch?&finish=${finish.toLowerCase()}`);
  };

  // ✅ Define routes where only minimal header is shown
  const minimalHeaderRoutes = ["/login", "/signup"];

  // ✅ Check if current route matches one of those
  const isMinimalHeader = minimalHeaderRoutes.includes(location.pathname);

  // ✅ Minimal Header (for login/signup)
  if (isMinimalHeader) {
    return (
      <header className="main-header minimal-header">
        <div className="container2">
          <div className="logo">
            <img src="/images/logo.png" alt="KLAY Logo" />
          </div>
          <div className="contact2" >
            <FontAwesomeIcon icon={faPhone} />
            <p>+91 9871400020</p>
          </div>
        </div>
      </header>
    );
  }

  // ✅ Full Header (for all other pages)
  return (
    <header className="main-header">
      <div className="container">
        <div className="logo">
          <img src="/images/logo.png" alt="KLAY Logo" />
        </div>

        <div className="contact">
          <FontAwesomeIcon icon={faPhone} />
          <span>+91 98714 00020</span>
        </div>

        <nav className="navbar">
          <ul>
            <li><a href="/">Home</a></li>
            <li
              className="dropdown"
              onMouseEnter={() => setDropdownVisible(true)}
              onMouseLeave={() => setDropdownVisible(false)}
            >
              <a href="#">Products</a>
              {dropdownVisible && (
                <ul className="dropdown-menu">
                  {[
                    "Matt",
                    "Metallic",
                    "Wooden",
                    "Textured",
                    "R-11Anti-Skid",
                    "Mosaics",
                    "Liner",
                    "High Gloss",
                    "Blast",
                    "Concrete",
                  ].map((finish) => (
                    <li key={finish}>
                      <a onClick={() => handleFinishClick(finish)}>{finish}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li><a href="/Collection">Collection</a></li>
            <li><a href="/About">About us</a></li>
            <li><a href="/ContactForm">Contact us</a></li>
            <li><a href="/ConsultingSection">Book a session</a></li>
            <li><a href="/BlogCard">Blog</a></li>
          </ul>
        </nav>

        <div className="search-bar">
          <input type="text" placeholder="Search" />
          <button className="search-button">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>

        <a href="/AddToGallery" className="add-to-gallery-button">
          <FontAwesomeIcon icon={faCartShopping} style={{ marginRight: "5px" }} />
        </a>

        <div>
          <span>
            <Link to="/login"><span>Login</span></Link>
          </span>
          <span>
            <Link to="/signup"><span>Signup</span></Link>
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
