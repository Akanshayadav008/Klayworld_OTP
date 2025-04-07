import React from 'react';
import Header from './Header';
import '../components/About.css';
import Aboutsection1 from '../components/Aboutsection1';
import Promoters from './Promoters';
import Stats from './Stats';
import TeamSection from './TeamSection';
import Footer from './Footer';

function About() {
  const sections = [
    {
      image: 'images/vission.webp',
      title: 'Our Vision',
      description: 'To be the best in class surface provider focusing on value-driven proposition.',
    },
    {
      image: 'images/mission.webp',
      title: 'Our Mission',
      description: 'To bring the finest quality surfaces to our customers while ensuring innovation and sustainability.',
    }
  ];

  return (
    <>
      <Header />
      <div className='about'>
        <h3 className="who">Who Are We</h3>
        <h1 className="welcome">Welcome to Klay</h1>
      </div>

      <div className="about-content">
        <p>
          Klay is a trusted brand name in the distribution and retail of premium tiles. 
          Based in the posh locality of Gurgaon, its showroom is the largest high street tile retail store 
          and the leading display center of large format tile slabs in North India. 
          From small to large spaces or outdoor to indoor requirements, Klay caters to all needs of clients 
          looking for comfort and value in their space. With a healthy mix of Indian and Italian origin surfaces, 
          our satisfied clients include the biggest names amongst the HNI, Hospitality, Education, 
          Industrial, and Architectural fraternity.
        </p>
      </div>

      {/* Container for multiple Aboutsection1 components */}
      <div className="about-sections-container">
        {sections.map((section, index) => (
          <Aboutsection1 
            key={index} 
            image={section.image} 
            title={section.title} 
            description={section.description} 
          />
        ))}
      </div>

      <h1 className='promoters'>Our Promoters</h1>
      <div className="promoter-section">
        <Promoters
          image="Rachit.webp" // Replace with actual image path
          name="Rachit Channana"
          title="Co-Founder and Managing Partner at KLAY"
          description="A graduate from DU and an MBA from IMT(G), Rachit has been a Merger & Acquisition advisor for over 12 years and has worked across the globe, and now wants to build value by organizing the trade and become a superior surface solution provider using all his knowledge of strategy, trade, and finance."
        />
         <Promoters
          image="Anupama.webp" // Replace with actual image path
          name="Anupama Kothari"
          title="(Co-Founder, COO, and Chief Design Officer at KLAY)"
          description="A graduate of NIFT (Delhi), London College of Fashion, and a Diploma for Interior designing from KLC Institute (London), Anupama has been leading the business under the guidance and supervision of her father Nandu Kothari. She has the entrepreneurial zest and a great eye for quality and detail."
        />
      </div>


      <Stats />
      <TeamSection />
      <Footer />
    </>
  );
}

export default About;
