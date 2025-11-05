import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faPhone,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db} from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "../components/Header.css";

function Header() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserName(userSnap.data().name || user.displayName || "");
          } else {
            setUserName(user.displayName || "User");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      } else {
        setUserName("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUserName("");
    navigate("/login");
  };

  const handleFinishClick = (finish) => {
    navigate(`/productsearch?&finish=${finish.toLowerCase()}`);
  };

  const minimalHeaderRoutes = ["/login", "/signup"];
  const isMinimalHeader = minimalHeaderRoutes.includes(location.pathname);

  // ✅ Minimal Header (for login/signup)
  if (isMinimalHeader) {
    return (
      <header className="main-header minimal-header">
        <div className="container2">
          <div className="logo">
            <img src="/images/logo.png" alt="KLAY Logo" />
          </div>
          <div className="contact2">
            <FontAwesomeIcon icon={faPhone} />
            <p>+91 9871400020</p>
          </div>
        </div>
      </header>
    );
  }

  // ✅ Full Header (for other pages)
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
          {userName ? (
            <span className="auth-buttons">
              <span className="user-name">Hi, {userName}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </span>
          ) : (
            <span className="auth-buttons">
              <Link to="/signup" className="signup-btn">Sign up</Link>
              <Link to="/login" className="signin-btn">Sign in</Link>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
