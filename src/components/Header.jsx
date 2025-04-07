import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "../components/Header.css";

function Header() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle click event for dropdown items
  const handleFinishClick = (finish) => {
    navigate(`/productsearch?&finish=${finish.toLowerCase()}`);
  };

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
                  {["Matt", "Metallic",  "Wooden", "Textured", "R-11Anti-Skid", "Mosaics", "Liner", "High Gloss", "Blast", "Concrete"].map((finish) => (
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
          <button>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
