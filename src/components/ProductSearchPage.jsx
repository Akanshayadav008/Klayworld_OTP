import React, { useState, useEffect } from "react";
import "./style.css";
import Header from "./Header";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";

const Search = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFinish, setSelectedFinish] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const productsPerPage = 6;
  const collectionName = "products";

  const getParams = () => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category")?.toLowerCase().trim();
    const finishParam = params.get("finish")?.toLowerCase().trim();
    return { categoryParam, finishParam };
  };

  useEffect(() => {
    const { categoryParam, finishParam } = getParams();
    if (categoryParam) setSelectedCategories([categoryParam]);
    if (finishParam) setSelectedFinish(finishParam);
  }, [location.search]);

  useEffect(() => {
    const fetchAllProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const prods = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    category: Array.isArray(data.category)
                        ? data.category.map((c) => c.toLowerCase().trim())
                        : [data.category?.toLowerCase().trim()],
                    finish: Array.isArray(data.finish)
                        ? data.finish.map((f) => f.toLowerCase().trim())
                        : [data.finish?.toLowerCase().trim()],
                    size: Array.isArray(data.size)
                        ? data.size.map((s) => s.toLowerCase().trim())
                        : [data.size?.toLowerCase().trim()],
                };
            });
            console.log("Fetched Products:", prods);
            setProducts(prods);
            setLoading(false);
        } catch (error) {
            console.error("❌ Error fetching products:", error);
            setLoading(false);
        }
    };
    fetchAllProducts();
}, []);

  useEffect(() => {
    if (products.length > 0) filterProducts();
  }, [products, selectedCategories, selectedFinish, selectedSize]);

  const filterProducts = () => {
    console.log("Filtering products...");
    console.log("Selected Categories:", selectedCategories);
    console.log("Selected Finish:", selectedFinish);
    console.log("Selected Size:", selectedSize);
    
    setLoading(true);
    let filteredResults = [...products];

    console.log("All Products:", filteredResults); // Log all fetched products

    if (searchText.trim() !== "") {
        filteredResults = filteredResults.filter((product) =>
            product.name?.toLowerCase().includes(searchText.toLowerCase())
        );
    }

    if (selectedCategories.length > 0) {
        filteredResults = filteredResults.filter((product) =>
            selectedCategories.some((cat) => product.category.includes(cat))
        );
    }

    if (selectedFinish) {
        filteredResults = filteredResults.filter((product) =>
            product.finish.includes(selectedFinish)
        );
    }

    if (selectedSize) {
        filteredResults = filteredResults.filter((product) =>
            product.size.includes(selectedSize)
        );
    }

    console.log("Filtered Products:", filteredResults); // Check if any products remain
    setFilteredProducts(filteredResults);
    setCurrentPage(1);
    setLoading(false);
};


  const categoryOptions = [...new Set(products.flatMap((p) => p.category))];
  const finishOptions = [...new Set(products.flatMap((p) => p.finish))];
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  const toggleCategoryDropdown = () => {
      setCategoryDropdownVisible(!categoryDropdownVisible);
  };
  
  const updateCategoryFilter = (e) => {
      const category = e.target.value;
      setSelectedCategories((prev) =>
          prev.includes(category)
              ? prev.filter((c) => c !== category) // Remove if already selected
              : [...prev, category] // Add if not selected
      );
  };
  const updateSizeFilter = (e) => {
    setSelectedSize(e.target.value);
};
      // For size filtering: maintain the size sub-category and size options
      const [sizeCategories, setSizeCategories] = useState([]);
      const [sizeOptions, setSizeOptions] = useState([]);
  
  
      // Define static size filters
      const sizeFilters = {
          Standard: [
              "400x800",
              "300x600",
              "300x300",
              "400x400",
              "600x600",
              "1200x2800",
              "600x1200",
              "800x1600",
              "1200x1800",
              "1200x2400",
              "1200x2780",
          ],
          Mosaic: [
              "100x100",
              "102x92",
              "48x48",
              "50x50",
              "75x150",
              "75x225",
              "75x300",
              "75x80",
              "85x150",
          ],
          Subway: ["100x200", "100x300", "110x110", "75x300"],
          Others: [
              "1000x3000",
              "1500x3000",
              "1800x1200",
              "198x198",
              "225x60",
              "790x2600",
              "225x60",
              "80x160",
              "60x120",
              "1200x1200",
              "900x180",
              "800x800",
              "800x3200",
              "800x3000",
              "200x1200",
          ],
      };
  
  
      // Helper: sort sizes by area (width * height)
      const sortByArea = (sizesArray) => {
          return sizesArray.slice().sort((a, b) => {
              const [w1, h1] = a.split("x").map(Number);
              const [w2, h2] = b.split("x").map(Number);
              return w1 * h1 - w2 * h2;
          });
      };
  
  
      // Create sorted arrays for each size category and set default options
      const sizeFiltersSorted = {
          Standard: sortByArea(sizeFilters.Standard),
          Mosaic: sortByArea(sizeFilters.Mosaic),
          Subway: sortByArea(sizeFilters.Subway),
          Others: sortByArea(sizeFilters.Others),
      };
  
  
      // On mount, set the size sub-categories and default size options (all sizes)
      useEffect(() => {
          const cats = Object.keys(sizeFiltersSorted);
          setSizeCategories(cats);
          // Default: combine all sizes (avoid duplicates)
          const allSizesSet = new Set();
          Object.values(sizeFiltersSorted).forEach((arr) =>
              arr.forEach((size) => allSizesSet.add(size))
          );
          const allSizesArray = Array.from(allSizesSet).sort((a, b) => {
              const [w1, h1] = a.split("x").map(Number);
              const [w2, h2] = b.split("x").map(Number);
              return w1 * h1 - w2 * h2;
          });
          setSizeOptions(allSizesArray);
      }, []);
  
  return (
    <div>
      <Header />
      <div className="containerbox">
      <div className="searchinputBox">
        <div className="InputHeader">Text Analysis Tool</div>
        <div style={{ fontSize: "16px", fontFamily: "Poppins" }}>
            Find Your Perfect Tile!
        </div>
        <div id="searchBar">
            <input
                type="text"
                id="searchInput"
                placeholder="Search for products..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="searchbutton" onClick={filterProducts}>
                Search
            </button>
        </div>

        {/* Category Filter - Multiple Select */}
        <div id="categoryFilterContainer">
            <label htmlFor="categoryDropdown">Filter:</label>
            <div id="toggleCategoryDropdown" onClick={toggleCategoryDropdown}>
                Select Space 
            </div>
            {categoryDropdownVisible && (
                <div id="categoryDropdown" className="dropdown-options">
                    {categoryOptions.map((category) => (
                        <div key={category} className="category-option">
                            <input
                                type="checkbox"
                                value={category}
                                onChange={updateCategoryFilter}
                                checked={selectedCategories.includes(category)}
                            />
                            <label>{category}</label>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Finish Filter */}
        <div id="finishFilterContainer">
            <select
                id="finishDropdown"
                value={selectedFinish || ""}
                onChange={(e) => setSelectedFinish(e.target.value)}
            >
                <option value="">All Finishes</option>
                {finishOptions.map((finish) => (
                    <option key={finish} value={finish}>
                        {finish}
                    </option>
                ))}
            </select>
        </div>

        {/* Uncomment if you want Size Filter */}
        <div id="sizeFilterContainer">
                        <select
                            id="subFilterDropdown"
                            onChange={(e) => {
                                const selectedCat = e.target.value;
                                if (selectedCat && sizeFiltersSorted[selectedCat]) {
                                    setSizeOptions(sizeFiltersSorted[selectedCat]);
                                } else {
                                    const allSizesSet = new Set();
                                    Object.values(sizeFiltersSorted).forEach((arr) =>
                                        arr.forEach((size) => allSizesSet.add(size))
                                    );
                                    const allSizesArray = Array.from(allSizesSet).sort((a, b) => {
                                        const [w1, h1] = a.split("x").map(Number);
                                        const [w2, h2] = b.split("x").map(Number);
                                        return w1 * h1 - w2 * h2;
                                    });
                                    setSizeOptions(allSizesArray);
                                }
                            }}
                        >
                            <option value="">Sizes Categories</option>
                            {sizeCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <select
                            id="sizeDropdown"
                            value={selectedSize}
                            onChange={updateSizeFilter}
                        >
                            <option value="">All Sizes</option>
                            {sizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    
    </div>

        <div className="resultbox" style={{ display: "flex", flexDirection: "column", minHeight: "480px" }}>
          <h2>Search Results</h2><br></br>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <p>No results found.</p>
              ) : (
                <div id="productGrid">
                  {filteredProducts
                    .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                    .map((product) => (
                      <div key={product.product_id} className="product-card" data-product-id={product.product_id}>
                        <div className="image-container">
                          <div className="spinner"></div>
                          <img
                            src={product.tileImage ? `http://147.93.28.17:3000/convertToWebP?url=${encodeURIComponent(product.tileImage)}` : ""}
                            alt={product.name}
                            loading="lazy"
                            className="product-image"
                            onLoad={(e) => {
                              e.target.style.opacity = "1";
                              if (e.target.previousSibling) e.target.previousSibling.remove();
                            }}
                            onClick={() => (window.location.href = `product-details?id=${product.product_id}`)}
                          />
                        </div>
                        <strong className="product-name" onClick={() => (window.location.href = `product-details?id=${product.product_id}`)}>
                          {product.name || "N/A"}
                        </strong>
         
                      </div>
                    ))}
                </div>
              )}

            </>
          )}

          {filteredProducts.length > productsPerPage && (
            <div className="pagination" style={{ marginTop: "auto", paddingTop: "10px" }}>
              <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </button>
              <button
                onClick={() => currentPage * productsPerPage < filteredProducts.length && setCurrentPage(currentPage + 1)}
                disabled={currentPage * productsPerPage >= filteredProducts.length}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
  
};

export default Search;
