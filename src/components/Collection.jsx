import React from "react";
import Header from "./Header";
import ImageSection from "./ImageSection";
import "../components/ImageSection.css";
import "../components/Collection.css";
import Footer from "./Footer";

const Collection = () => {
  return (
    <>
      <h1 className="heading">Our Collection</h1>
      <ImageSection />
      <Footer />
    </>
  );
};

export default Collection;
