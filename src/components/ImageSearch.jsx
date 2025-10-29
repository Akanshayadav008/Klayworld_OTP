import React, { useState, useEffect } from "react";
import { db } from "./../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Header from "./Header";
import "./ImageSearch.css";


// Helper function to clean up size strings
function cleanSize(size) {
  return size.replace(/['"\s]/g, "").replace(/mm|cm/g, "").trim();
}


const ImageSearch = () => {
  // States for file, preview image, search results, filters, and loading spinner
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState("combined");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [finishes, setFinishes] = useState([]);


  // Filter input state
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFinish, setFilterFinish] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [filterMin, setFilterMin] = useState("");
  const [filterMax, setFilterMax] = useState("");


  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    category: "",
    finish: "",
    size: "",
    min: "",
    max: ""
  });


  const [filterVisible, setFilterVisible] = useState(false);
  const collectionName = "products";


  // On mount, restore any previously stored image or results
  useEffect(() => {
    const storedImage = sessionStorage.getItem("uploadedImage");
    if (storedImage) setUploadedImage(storedImage);


    const storedResults = sessionStorage.getItem("searchResults");
    if (storedResults) setSearchResults(JSON.parse(storedResults));
  }, []);


  // Fetch categories from Firestore on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, collectionName);
        const snapshot = await getDocs(categoriesRef);
        const uniqueCategories = new Set();
        snapshot.forEach((docSnap) => {
          const catData = docSnap.data().category || [];
          catData.forEach((cat) => uniqueCategories.add(cat));
        });
        setCategories(Array.from(uniqueCategories));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);


  // Fetch finishes from Firestore on component mount
  useEffect(() => {
    const fetchFinishes = async () => {
      try {
        const finishesRef = collection(db, "klay-Final-Products-25-02");
        const snapshot = await getDocs(finishesRef);
        const uniqueFinishes = new Set();
        snapshot.forEach((docSnap) => {
          const finishData = docSnap.data().finish || [];
          finishData.forEach((fin) => uniqueFinishes.add(fin));
        });
        setFinishes(Array.from(uniqueFinishes));
      } catch (error) {
        console.error("Error fetching finishes:", error);
      }
    };
    fetchFinishes();
  }, []);


  // Handle file selection and preview
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);


    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileUrl = e.target.result;
        setUploadedImage(fileUrl);
        sessionStorage.setItem("uploadedImage", fileUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImage("");
      sessionStorage.removeItem("uploadedImage");
    }
  };


  // Handle form submission to upload image & get search results
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please upload an image.");
      return;
    }


    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("searchType", searchType);


    setLoading(true);
    setSearchResults([]);


    try {
      const response = await fetch("https://image.klayworld.com/upload", {
        method: "POST",
        body: formData,
      });


      if (!response.ok) {
        throw new Error("Failed to fetch results. Please try again.");
      }


      const data = await response.json();
      if (data.top_matches && data.top_matches.length > 0) {
        sessionStorage.setItem("searchResults", JSON.stringify(data.top_matches));
        setSearchResults(data.top_matches);
      } else {
        setSearchResults([]);
        alert("No matches found. Try another image or search type.");
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  /**
   * handleImageLoad
   * For each loaded image, we force it into a 160x130 container (thumbnail style).
   * If the image is taller than it is wide (portrait orientation), we rotate it 90°
   * so that it still fits neatly within the same container size.
   */
  const handleImageLoad = (e) => {
    const img = e.target;
    const container = img.parentElement;
   
    // Set container dimensions
    container.style.width = "160px";
    container.style.height = "130px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.overflow = "hidden";


    // Reset any previous transformations
    img.style.transform = "";
    img.style.width = "";
    img.style.height = "";


    // Calculate aspect ratios
    const containerRatio = 160 / 130; // width/height
    const imageRatio = img.naturalWidth / img.naturalHeight;


    if (imageRatio > containerRatio) {
      // Image is wider than container
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
    } else {
      // Image is taller than container
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
    }
  };


  // Filter the results based on user-applied filters
  const filteredResults = searchResults.filter((match) => {
    // Handle category: if array, join into a string
    const categoryString = Array.isArray(match.category)
      ? match.category.join(" ")
      : (match.category || "N/A");
    const finishString = Array.isArray(match.finish)
      ? match.finish.join(" ")
      : (match.finish || "N/A");


    const category = categoryString.toLowerCase();
    const finish = finishString.toLowerCase();
    const sizes = Array.isArray(match.sizes)
      ? match.sizes.map((s) => cleanSize(s.toLowerCase()))
      : [];
    const price = parseFloat(match.price) || 0;


    const matchesCategory =
      appliedFilters.category === "" ||
      category.includes(appliedFilters.category.toLowerCase());
    const matchesFinish =
      appliedFilters.finish === "" ||
      finish.includes(appliedFilters.finish.toLowerCase());
    const matchesSize =
      appliedFilters.size === "" ||
      sizes.includes(cleanSize(appliedFilters.size.toLowerCase()));
    const minPrice = appliedFilters.min ? parseFloat(appliedFilters.min) : 0;
    const maxPrice = appliedFilters.max ? parseFloat(appliedFilters.max) : Infinity;
    const matchesPrice = price >= minPrice && price <= maxPrice;


    return matchesCategory && matchesFinish && matchesSize && matchesPrice;
  });


  // Apply filters
  const applyFiltersHandler = () => {
    setAppliedFilters({
      category: filterCategory,
      finish: filterFinish,
      size: filterSize,
      min: filterMin,
      max: filterMax,
    });
  };


  return (
    <div>
      <main>
        <div className="contaier">
          {/* Upload Section */}
          <div className="uploadarea">
            <div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  marginTop: "10px",
                  fontFamily: "Open Sans",
                }}
              >
                Image Analysis Tool
              </div>
              <div
                style={{
                  fontSize: "16px",
                  marginTop: "10px",
                  marginBottom: "10px",
                  fontFamily: "Poppins",
                }}
              >
                Find Your Perfect Tile!
              </div>
            </div>
            <section className="upload-section">
              <form
                id="uploadForm"
                onSubmit={handleSubmit}
                encType="multipart/form-data"
              >
                <div className="upload_header">
                  <h2>Upload</h2>
                  <div className="icon-upload-wrapper">
                    <label htmlFor="fileInput">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#5f6368"
                      >
                        <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z" />
                      </svg>
                    </label>
                  </div>
                  <input
                    type="file"
                    id="fileInput"
                    name="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <div className="upload_box">
                  {uploadedImage && (
                    <img
                      id="uploadedImagePreview"
                      src={uploadedImage}
                      alt="Uploaded Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <div className="space">
                  <label style={{ fontSize: "14px", fontFamily: "Poppins" }}>
                    Filter:
                  </label>
                  <select
                    id="searchType"
                    name="searchType"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="combined">(Color + Texture)</option>
                    <option value="texture">Texture</option>
                    <option value="color">Color</option>
                  </select>
                  <button className="search_button" type="submit">
                    Search
                  </button>
                </div>
              </form>
            </section>
          </div>


          <div className="vertical-line"></div>


          {/* Results Section */}
          <div className="resultbox">
            <section className="results-section">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: "30px",
                }}
              >
                <h2>Search Results</h2>
                <img
                  src="/static/filter.svg"
                  style={{ height: "22px", cursor: "pointer" }}
                  alt="Filter Icon"
                  onClick={() => setFilterVisible(!filterVisible)}
                />
              </div>
              {filterVisible && (
                <div id="filterOptions" style={{ marginTop: "10px" }}>
                  <select
                    id="filterCategory"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Space</option>
                    {categories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    id="filterFinish"
                    value={filterFinish}
                    onChange={(e) => setFilterFinish(e.target.value)}
                  >
                    <option value="">All Finish</option>
                    {finishes.map((fin, index) => (
                      <option key={index} value={fin}>
                        {fin}
                      </option>
                    ))}
                  </select>
                  <select
                    id="filterSizes"
                    value={filterSize}
                    onChange={(e) => setFilterSize(e.target.value)}
                  >
                    <option value="">All Sizes</option>
                    <optgroup label="Standard Sizes">
                      <option value="300x300">300x300</option>
                      <option value="300x600">300x600</option>
                      <option value="400x400">400x400</option>
                      <option value="400x800">400x800</option>
                      <option value="600x600">600x600</option>
                      <option value="600x1200">600x1200</option>
                      <option value="800x1600">800x1600</option>
                      <option value="1200x1800">1200x1800</option>
                      <option value="1200x2400">1200x2400</option>
                      <option value="1200x2780">1200x2780</option>
                      <option value="1200x2800">1200x2800</option>
                    </optgroup>
                    <optgroup label="Mosaic Sizes">
                      <option value="48x48">48x48</option>
                      <option value="50x50">50x50</option>
                      <option value="75x80">75x80</option>
                      <option value="75x150">75x150</option>
                      <option value="75x225">75x225</option>
                      <option value="75x300">75x300</option>
                      <option value="85x150">85x150</option>
                      <option value="100x100">100x100</option>
                      <option value="102x92">102x92</option>
                    </optgroup>
                    <optgroup label="Subway Sizes">
                      <option value="75x300">75x300</option>
                      <option value="100x200">100x200</option>
                      <option value="100x300">100x300</option>
                      <option value="110x110">110x110</option>
                    </optgroup>
                    <optgroup label="Other Sizes">
                      <option value="60x120">60x120</option>
                      <option value="80x160">80x160</option>
                      <option value="198x198">198x198</option>
                      <option value="225x60">225x60</option>
                      <option value="900x180">900x180</option>
                      <option value="1000x3000">1000x3000</option>
                      <option value="1200x1200">1200x1200</option>
                      <option value="1500x3000">1500x3000</option>
                      <option value="1800x1200">1800x1200</option>
                      <option value="790x2600">790x2600</option>
                      <option value="800x800">800x800</option>
                      <option value="800x3200">800x3200</option>
                      <option value="200x1200">200x1200</option>
                    </optgroup>
                  </select>
                  <input
                    type="number"
                    id="filterMin"
                    placeholder="Min Value"
                    style={{ width: "80px" }}
                    value={filterMin}
                    onChange={(e) => setFilterMin(e.target.value)}
                  />
                  <input
                    type="number"
                    id="filterMax"
                    placeholder="Max Value"
                    style={{ width: "80px" }}
                    value={filterMax}
                    onChange={(e) => setFilterMax(e.target.value)}
                  />
                  <button className="apply_Button" onClick={applyFiltersHandler}>
                    Apply Filters
                  </button>
                </div>
              )}
              {loading && (
                <div id="loadingSpinner" className="spinner" style={{ display: "block" }}>
                  {/* Loading spinner styling via CSS */}
                </div>
              )}
              <div id="results" className="results-grid">
                {filteredResults.length > 0 ? (
                  filteredResults.map((match, index) => (
                    <a
                    key={index}
                    href={`product-details?id=${match.product_id}`}
                    className="result-card"
                  >
                      {/* Container to force a fixed size: 160x130 */}
                      <div
                        style={{
                          position: "relative",
                          width: "160px",
                          height: "130px",
                          overflow: "hidden",
                          borderRadius:"10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin:"auto"
                        }}
                      >
                        
                        <img
                          src={`https://converter.klayworld.com/convertToWebP?url=${encodeURIComponent(match.tileImage)}`}
                          alt={match.name}
                          onLoad={handleImageLoad}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "10px",
                            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                           
                          }}
                        />
                      </div>


                      <div className="tile-name">{match.name}</div>
                      <div style={{ display: "none" }} className="tile-category">
                        {match.category || "N/A"}
                      </div>
                      <div style={{ display: "none" }} className="tile-finish">
                        {match.finish || "N/A"}
                      </div>
                      <div style={{ display: "none" }} className="tile-price">
                        {match.price || 0}
                      </div>
                      <div style={{ display: "none" }} className="tile-sizes">
                        {match.sizes && Array.isArray(match.sizes)
                          ? match.sizes.map(cleanSize).join(",")
                          : "N/A"}
                      </div>
                    </a>
                  ))
                ) : (
                  <p>No results yet. Upload an image and search to see results here.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};


export default ImageSearch;



