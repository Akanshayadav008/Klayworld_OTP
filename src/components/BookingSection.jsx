import React from "react";
import "../components/BookingSection.css"; // External CSS file
import { useNavigate } from "react-router-dom";

const BlogSection = () => {
    const navigate = useNavigate();
    const blogPosts = [
        {
            image: "images/blog1.jpeg",
            title: "OF TILE FITS",
            emphasized: "OF TILE FITS",
            link: "/blog2"
        },
        {
            image: "images/blog3.jpeg",
            title: "HOW TO INSTALL LARGE FORMAT TILES ?",
            emphasized: "INSTALL LARGE",
            link: "/blog1"
        },
        {
            image: "images/blog2.webp",
            title: "THE FUTURE OF TILES",
            emphasized: "FUTURE OF",
            link: "/blog2"
        }
    ];

    return (
        <div className="home-container">
            <h2 className="home-title">OUR BLOGS</h2>
            <div className="home-grid">
                {blogPosts.map((post, index) => (
                    <div key={index} className="home-card" onClick={() => navigate(post.link)} style={{ cursor: "pointer" }}>
                        <img src={post.image} alt={post.title} className="home-image" />
                    </div>
                ))}
            </div>
            <button className="view-more-button" onClick={() => navigate("/BlogCard")}>View More</button>
        </div>
    );
};

const BookingSection = () => { 
    const navigate = useNavigate();
    return (
        <div className="booking-container">
            <span className="booking-text">Book a Session with our Consulting Team and get all your doubts solved in no time</span>
            <button className="booking-button" onClick={() => navigate("/ConsultingSection")}>BOOK SESSION</button>
        </div>
    );
};

export { BlogSection, BookingSection };
