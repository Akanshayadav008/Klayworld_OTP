import React, { useState, useEffect, useRef } from "react";
import "./style.css"; // make sure your CSS is imported
import Header from "./Header";
import { db } from "./../../firebaseConfig.jsx";
import { collection, getDocs } from "firebase/firestore";
import Footer from "./Footer";




const ProductSearch = () => {
    // State declarations
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 6;
    const collectionName = "products";




    // (Removed synonymsCache since synonyms functionality has been removed)
    // const synonymsCache = useRef({});




    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [selectedFinish, setSelectedFinish] = useState("");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(Infinity);
    const [selectedSize, setSelectedSize] = useState("");
    const [searchText, setSearchText] = useState("");
    // Active search query state
    const [activeQuery, setActiveQuery] = useState("");
    const [loading, setLoading] = useState(false);




    // New state: whether to show the "No results" message after 10 sec.
    const [showNoResultsDelayed, setShowNoResultsDelayed] = useState(false);




    // For showing/hiding the category dropdown
    const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);




    // Options for filters (populated from products)
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [finishOptions, setFinishOptions] = useState([]);




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




    // Fetch products from Firestore on component mount
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const prods = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        ...data,
                        finish:
                            typeof data.finish === "string" &&
                                data.finish.toLowerCase() === "high gloss"
                                ? "Marble"
                                : data.finish,
                    };
                });
                setProducts(prods);
                // Initially, do not show any products until a search is performed.
                setFilteredProducts([]);
            } catch (error) {
                console.error("Error fetching products: ", error);
            }
        };




        fetchAllProducts();
    }, [collectionName]);




    // Update category and finish options when products change
    useEffect(() => {
        const categories = new Set();
        const finishes = new Set();
        products.forEach((product) => {
            if (product.category && Array.isArray(product.category)) {
                product.category.forEach((cat) => categories.add(cat));
            }
            if (Array.isArray(product.finish)) {
                product.finish.forEach((f) => finishes.add(f.trim()));
            } else if (typeof product.finish === "string") {
                product.finish
                    .split(",")
                    .map((f) => f.trim())
                    .forEach((f) => finishes.add(f));
            }
        });
        setCategoryOptions(Array.from(categories).sort());
        setFinishOptions(Array.from(finishes).sort());
    }, [products]);




    // Delay showing the "No results." message after 10 seconds if filteredProducts is still empty
    useEffect(() => {
        if (activeQuery !== "") {
            const timer = setTimeout(() => {
                if (filteredProducts.length === 0) {
                    setShowNoResultsDelayed(true);
                }
            }, 10000); // 10 seconds
            return () => {
                clearTimeout(timer);
                setShowNoResultsDelayed(false);
            };
        }
    }, [activeQuery, filteredProducts]);




    // Utility: Extract keywords from a sentence.
    const extractKeywords = (sentence) => {
        const stopWords = [
            "a", "an", "the", "and", "or", "but", "on", "in", "with", "to", "of", "at", "by", "for", "as", "from"
        ];
        return sentence
            .toLowerCase()
            .split(/\W+/)
            .filter((word) => word && !stopWords.includes(word));
    };




    // Utility: Count keyword matches using product attributes.
    const countKeywordMatches = (product, keywords) => {
        let matchCount = 0;
        const { name, category, Base_Color, finish, space, attributes } = product;
        const attributeWeights = {
            name: 3,
            category: 2,
            Base_Color: 2,
            finish: 1,
            space: 1,
            attributes: 2,
        };




        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, "i");




            if (
                (name && regex.test(name)) ||
                (category && category.some((cat) => regex.test(cat))) ||
                (Base_Color && Base_Color.some((color) => regex.test(color))) ||
                (finish && regex.test(finish)) ||
                (space && regex.test(space)) ||
                (attributes && attributes.some((attr) => regex.test(attr)))
            ) {
                matchCount += attributeWeights.name * 2;
            }
        }
        return matchCount;
    };




    // Filter handlers




    const toggleCategoryDropdown = () => {
        setCategoryDropdownVisible(!categoryDropdownVisible);
    };




    // Update category filter without triggering an immediate search.
    const updateCategoryFilter = (e) => {
        const value = e.target.value;
        const newSet = new Set(selectedCategories);
        if (e.target.checked) {
            newSet.add(value);
        } else {
            newSet.delete(value);
        }
        setSelectedCategories(newSet);
    };




    // Update finish filter.
    const updateFinishFilter = (e) => {
        setSelectedFinish(e.target.value);
    };




    // Normalize and update size filter.
    const normalizeSize = (size) => {
        if (!size) return "";
        return size.replace(/^['"]+|['"]+$/g, "").trim().toLowerCase();
    };




    const updateSizeFilter = (e) => {
        setSelectedSize(normalizeSize(e.target.value));
    };




    // Reset all filters.
    const resetFilters = () => {
        setSelectedCategories(new Set());
        setSelectedFinish("");
        setSelectedSize("");
        setMinPrice(0);
        setMaxPrice(Infinity);
    };




    // Modified search function with synchronous keyword matching.
    const searchProducts = () => {
        if (!searchText.trim()) {
            console.log("No search input provided.");
            setActiveQuery("");
            setFilteredProducts([]);
            setCurrentPage(1);
            return;
        }
        setActiveQuery(searchText.trim());
        setLoading(true);




        const keywords = extractKeywords(searchText);




        // Process all products synchronously.
        const scoredProductsResults = products.map((product) => {
            const matchCount = countKeywordMatches(product, keywords);
            return matchCount > 0 ? { product, matchCount } : null;
        });




        const scoredProducts = scoredProductsResults.filter((item) => item !== null);
        let maxMatchCount = 0;
        scoredProducts.forEach((item) => {
            if (item.matchCount > maxMatchCount) {
                maxMatchCount = item.matchCount;
            }
        });




        const topMatches = scoredProducts
            .filter((item) => item.matchCount === maxMatchCount)
            .map((item) => item.product);




        if (topMatches.length === 0) {
            setFilteredProducts([]);
            setCurrentPage(1);
            setLoading(false);
            return;
        }




        // Apply additional filters: category, finish, size, and price.
        const filteredByCategory = topMatches.filter((product) =>
            selectedCategories.size === 0 ||
            Array.from(selectedCategories).every((category) =>
                product.category?.includes(category)
            )
        );




        const filteredByFinish = filteredByCategory.filter((product) => {
            if (!selectedFinish) return true;
            let productFinishes = [];
            if (Array.isArray(product.finish)) {
                productFinishes = product.finish.map((f) => f.trim().toLowerCase());
            } else if (typeof product.finish === "string") {
                productFinishes = [product.finish.trim().toLowerCase()];
            }
            return productFinishes.includes(selectedFinish.toLowerCase());
        });




        const filteredBySize = filteredByFinish.filter((product) => {
            if (!selectedSize) return true;
            let productSizes = [];
            if (Array.isArray(product.variation)) {
                productSizes = product.variation.flatMap((variant) =>
                    variant.size ? variant.size.map((s) => normalizeSize(s.name)) : []
                );
            }
            if (Array.isArray(product.sizes)) {
                productSizes = productSizes.concat(
                    product.sizes.map((s) => normalizeSize(s))
                );
            }
            return productSizes.includes(normalizeSize(selectedSize));
        });




        const filteredByPrice = filteredBySize.filter(
            (product) => product.price >= minPrice && product.price <= maxPrice
        );




        setFilteredProducts(filteredByPrice);
        setCurrentPage(1);
        setLoading(false);
    };




    // useEffect to re-run the search whenever non-price filters change (if a query has already been made)
    useEffect(() => {
        if (activeQuery) {
            searchProducts();
        }
    }, [selectedCategories, selectedFinish, selectedSize]);




    // Pagination calculations
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(
        indexOfFirstProduct,
        indexOfLastProduct
    );




    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };




    const nextPage = () => {
        if (currentPage * productsPerPage < filteredProducts.length)
            setCurrentPage(currentPage + 1);
    };




    // Show pagination only if a search has been performed and there are enough results.
    const showPagination =
        activeQuery !== "" && filteredProducts.length > productsPerPage;




    return (
        <>
            <div className="container-search">





                <div className="containerbox">
                    {/* Left Column – Filters */}
                    <div className="searchinputBox">
                        <div className="InputHeader">Text Analysis Tool</div>
                        <div style={{ fontSize: "16px", fontFamily: "Poppins" }}>
                            Find Your Perfect Tile !
                        </div>
                        <div id="searchBar">
                            <input
                                type="text"
                                id="searchInput"
                                placeholder="Search for products..."
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    if (!e.target.value.trim()) {
                                        setActiveQuery("");
                                        setFilteredProducts([]);
                                        setCurrentPage(1);
                                    }
                                }}
                            />
                            {/* On click, the search button calls both resetFilters() and searchProducts() */}
                            <button
                                className="searchbutton"
                                onClick={() => {
                                    resetFilters();
                                    searchProducts();
                                }}
                            >
                                Search
                            </button>
                        </div>




                        {/* Category Filter */}
                        <div id="categoryFilterContainer">
                            <label htmlFor="categoryDropdown">Filter:</label>
                            <div id="toggleCategoryDropdown" onClick={toggleCategoryDropdown}>
                                Select Space
                            </div>
                            {categoryDropdownVisible && (
                                <div id="categoryDropdown">
                                    {categoryOptions.map((category) => (
                                        <div key={category} className="category-option">
                                            <input
                                                type="checkbox"
                                                value={category}
                                                onChange={updateCategoryFilter}
                                                checked={selectedCategories.has(category)}
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
                                value={selectedFinish}
                                onChange={updateFinishFilter}
                            >
                                <option value="">All Finish</option>
                                {finishOptions.map((finish) => (
                                    <option key={finish} value={finish}>
                                        {finish}
                                    </option>
                                ))}
                            </select>
                        </div>




                        {/* Size Filter */}
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




                        {/* Price Filter */}
                        <div id="priceFilterContainer">
                            <input
                                type="number"
                                id="minPriceInput"
                                placeholder="Min Price"
                                value={minPrice === 0 ? "" : minPrice}
                                onChange={(e) =>
                                    setMinPrice(parseFloat(e.target.value) || 0)
                                }
                            />
                            <input
                                type="number"
                                id="maxPriceInput"
                                placeholder="Max Price"
                                value={maxPrice === Infinity ? "" : maxPrice}
                                onChange={(e) =>
                                    setMaxPrice(parseFloat(e.target.value) || Infinity)
                                }
                            />
                            <button id="applyPriceFilter" onClick={searchProducts}>
                                Apply
                            </button>
                        </div>
                    </div>




                    <div className="vertical-line"></div>




                    {/* Right Column – Results */}
                    <div className="resultbox" style={{ display: "flex", flexDirection: "column", minHeight: "480px" }}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                gap: "30px",
                            }}
                        >
                            <h2>Search Results</h2>
                        </div>




                        {activeQuery === "" ? (
                            <div id="results" style={{ marginTop: "21px", fontSize: "18px" }}>
                                <p>No results yet. Search by Text to see results here.</p>
                            </div>
                        ) : (
                            <>
                                <div id="results" style={{ marginTop: "21px", fontSize: "18px" }}>
                                    {showNoResultsDelayed && filteredProducts.length === 0 && <p>No results.</p>}
                                </div>
                                <div
                                    id="loadingSpinner"
                                    style={{ display: loading ? "block" : "none" }}
                                >
                                    <img src="loading.gif" alt="Loading..." width="50" />
                                </div>
                                <div id="productGrid">
                                    {currentProducts.map((product) => (
                                        <div
                                            key={product.product_id}
                                            className="product-card"
                                            data-product-id={product.product_id}
                                        >
                                            <div className="image-container">
                                                <div className="spinner"></div>
                                                <img
                                                    src={`https://converter.klayworld.com/convertToWebP?url=${encodeURIComponent(product.tileImage)}`}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    className="product-image"
                                                    onLoad={(e) => {
                                                        e.target.style.opacity = "1";
                                                        if (e.target.previousSibling)
                                                            e.target.previousSibling.remove();
                                                    }}
                                                    onClick={() =>
                                                        (window.location.href = `product-details?id=${product.product_id}`)
                                                    }
                                                />
                                            </div>




                                            <strong
                                                className="product-name"
                                                onClick={() =>
                                                    (window.location.href = `product-details?id=${product.product_id}`)
                                                }
                                            >
                                                {product.name || "N/A"}
                                            </strong>




                                            <div className="icon-container">
                                                <div className="icon-wrapper">
                                                    <img
                                                        src="images/icons/Walls.svg"
                                                        alt="Wall"
                                                        loading="lazy"
                                                        className="icon"
                                                    />
                                                    <span className="icon-label">Wall</span>
                                                </div>
                                                <div className="icon-wrapper">
                                                    <img
                                                        src="images/icons/Highlight.svg"
                                                        alt="Highlight"
                                                        loading="lazy"
                                                        className="icon"
                                                    />
                                                    <span className="icon-label">Highlight</span>
                                                </div>
                                                <div className="icon-wrapper">
                                                    <img
                                                        src="images/icons/Floor.svg"
                                                        alt="Floor"
                                                        loading="lazy"
                                                        className="icon"
                                                    />
                                                    <span className="icon-label">Floor</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}




                        {/* Pagination buttons always at the bottom */}
                        {showPagination && (
                            <div className="pagination" style={{ marginTop: "auto", paddingTop: "10px" }}>
                                <button
                                    id="prevPage"
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <button
                                    id="nextPage"
                                    onClick={nextPage}
                                    disabled={currentPage * productsPerPage >= filteredProducts.length}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};




export default ProductSearch;









