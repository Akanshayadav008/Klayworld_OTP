import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import "../components/BlogCard.css"; // Ensure you have the required CSS
import Header from "./Header";
import Footer from "./Footer";

const blogPosts = [
  {
    image: "images/blog3.jpeg",
    title: "What type of tile fits where?",
    date: "12TH APRIL, 2022",
    description: "Start with a great tile, and the rest will fall into place...",
    link: "/Blog1",
  },
  {
    image: "images/blog1.jpeg",
    title: "The future of tiles",
    date: "12TH APRIL, 2022",
    description: "Tiles have been subject to continuous evolution for a very long time...",
    link: "/Blog2",
  },
];

const BlogCard = () => {
  
  // Scroll to the top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="blog-section">
        {blogPosts.map((post, index) => (
          <div key={index} className="blog-card">
            <div className="blog-image">
              <img src={post.image} alt={post.title} />
              <div className="blog-overlay">
                <span className="blog-category">{post.category}</span>
              </div>
            </div>

            <div className="blog-content">
              <p className="blog-date">{post.date}</p>
              <h3 className="blog-title">{post.title}</h3>
              <p className="blog-description">{post.description}</p>
              <div className="blog-footer">
                <a href={post.link} className="read-more">Read More</a>
                <div className="social-icons">
                  <Icon icon="mdi:facebook" className="icon" />
                  <Icon icon="mdi:twitter" className="icon" />
                  <Icon icon="mdi:instagram" className="icon" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
};

export default BlogCard;
