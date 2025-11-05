import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header"; 
import Home from "./components/Home";
import AdminProductPage from "./components/Admin";
import ProductSearch from "./components/SearchPage";
import ProductDetails from "./components/Description";
import ImageSearch from './components/ImageSearch';
import Collection from './components/Collection';
import About from './components/About';
import ContactForm from './components/ContactForm';
import ConsultingSection from "./components/ConsultingSection";
import BlogCard from './components/BlogCard';
import Blog1 from './components/Blog1';
import Blog2 from './components/Blog2';
import CategoryPage from './components/CategoryPage';
import Search from "./components/ProductSearchPage";
import AddToGallery from "./components/AddToGallery";
import DeliveryAddress from "./components/DeliveryAddress";
import OrderSuccess from "./components/OrderSuccess";
import SignupWithPhoneOTP from "./components/Signup";
import LoginWithEmailOrPhone from "./components/login";
import Tag from "./components/Tag";

// ✅ Redux + Firebase imports (added safely)
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { setUser, clearUser } from "./redux/userSlice";

function App() {
  const dispatch = useDispatch();

  // ✅ Firebase Auth → Redux listener (no effect on routes)
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      // ✅ Only keep serializable fields
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        phoneNumber: currentUser.phoneNumber,
        emailVerified: currentUser.emailVerified,
      };
      dispatch(setUser(userData));
    } else {
      dispatch(clearUser());
    }
  });

  return () => unsubscribe();
}, [dispatch]);


  return (
    <Router>
      {/* ✅ Global Header visible on all pages */}
      <Header />

      {/* ✅ Page content below header */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Tag />} />
        <Route path="/admin" element={<AdminProductPage />} />
        <Route path="/search" element={<ProductSearch />} />
        <Route path="/product-details" element={<ProductDetails />} />
        <Route path="/ImageSearch" element={<ImageSearch />} />
        <Route path="/Collection" element={<Collection />} />
        <Route path="/About" element={<About />} />
        <Route path="/ContactForm" element={<ContactForm />} />
        <Route path="/ConsultingSection" element={<ConsultingSection />} />
        <Route path="/BlogCard" element={<BlogCard />} />
        <Route path="/Blog1" element={<Blog1 />} />
        <Route path="/Blog2" element={<Blog2 />} />
        <Route path="/collection/:category" element={<CategoryPage />} />
        <Route path="/productsearch" element={<Search />} />
        <Route path="/AddToGallery" element={<AddToGallery />} />
        <Route path="/DeliveryAddress" element={<DeliveryAddress />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/signup" element={<SignupWithPhoneOTP />} />
        <Route path="/login" element={<LoginWithEmailOrPhone />} />
      </Routes>
    </Router>
  );
}

export default App;
