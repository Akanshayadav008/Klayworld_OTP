import React, { useEffect, useState } from "react";
import { db } from "./../../firebaseConfig.jsx";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const AdminProductPage = () => {
    const [products, setProducts] = useState([]);
    const [editedData, setEditedData] = useState({});
    const collectionName = "klay-Final-Products-25-02";

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const productList = querySnapshot.docs.map((docSnap) => ({
                    product_id: docSnap.id,
                    ...docSnap.data(),
                }));
                setProducts(productList);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        fetchProducts();
    }, []);

    const handleAddProduct = async () => {
        try {
            const productRef = collection(db, collectionName); // Reference to Firestore collection

            // Define new product structure exactly as required
            const newProduct = {
                shortDescription: [],
                review: [],
                tag: [],
                id: [],
                space: [],
                price: [],
                highlightingTiles: [],
                tileImage: [],
                thickness: [],
                name: "",
                meta_view: [],
                ratings: [],
                attributes: [],
                variation: [
                    {
                        color: [],
                        size: [
                            {
                                name: "",
                                sampleStock: "0",
                                stock: "0",
                                price: "0"
                            }
                        ]
                    }
                ],
                technicalImage: [],
                size: [],
                product_id: "", // Will be updated later
                category: [],
                finish: [],
                pin_code: [],
                image: [],
                highlighterRendersURL: [],
                Brand: [],
                location: [],
                new: []
            };

            // Add new product to Firestore
            const docRef = await addDoc(productRef, newProduct);
            const newProductId = docRef.id;

            console.log("New product added with ID:", newProductId);

            // Update Firestore document with generated product_id
            await updateDoc(doc(db, collectionName, newProductId), { product_id: newProductId });

            console.log("Updated product_id in Firestore.");

            // Update local state with new product
            setProducts((prev) => [...prev, { ...newProduct, product_id: newProductId }]);

        } catch (error) {
            console.error("Error adding product:", error);
        }
    };


    // Extended handleChange to support nested keys:
    // key: top-level key (e.g. "variation")
    // subKey: second-level key (e.g. "color" or "size")
    // nestedKey: third-level key if needed (e.g. for size fields: "name", "stock", etc.)
    const handleChange = (e, productId, key, subKey) => {
        let newValue = e.target.value.trim(); // Trim input to avoid extra spaces

        setEditedData((prevData) => {
            const updatedProduct = { ...(prevData[productId] || {}) }; // Ensure it always has a valid object

            if (key === "variation") {
                // Ensure variation exists
                if (!updatedProduct.variation) {
                    updatedProduct.variation = [{ size: [] }];
                }

                if (subKey === "color") {
                    // Convert comma-separated string into an array of trimmed values
                    updatedProduct.variation[0].color = newValue
                        ? newValue.split(",").map((c) => c.trim())
                        : [];
                } else if (subKey === "size") {
                    const existingSizes = updatedProduct.variation[0].size || [];
                    updatedProduct.variation[0].size = newValue
                        ? newValue.split(",").map((size, index) => ({
                            name: size.trim(),
                            stock: existingSizes[index]?.stock || "0",
                            sampleStock: existingSizes[index]?.sampleStock || "0",
                            price: existingSizes[index]?.price || "0",
                        }))
                        : [];
                } else {
                    // Handle other subKeys like "stock", "sampleStock", "price"
                    updatedProduct.variation[0].size = updatedProduct.variation[0].size?.map((s, index) => ({
                        ...s,
                        [subKey]: newValue.split(",")[index]?.trim() || "",
                    })) || [];
                }
            } else {
                // Fields that should be stored as arrays
                const arrayFields = [
                    "category",
                    "attributes",
                    "Brand",
                    "finish",
                    "highlighterRendersURL",
                    "highlightingTiles",
                    "image",
                    "location",
                    "meta_view",
                    "new",
                    "pin_code",
                    "price",
                    "ratings",
                    "review",
                    "shortDescription",
                    "space",
                    "tag",
                    "technicalImage",
                    "thickness",
                    "tileImage"
                ];

                if (key === "product_id") {
                    updatedProduct[key] = [newValue]; // Ensure product_id is stored as an array
                } else {
                    updatedProduct[key] = arrayFields.includes(key)
                        ? newValue.split(",").map((c) => c.trim()) // Convert to an array
                        : newValue;
                }
            }

            return { ...prevData, [productId]: updatedProduct };
        });
    };


    const handleSave = async (product_id) => {
        if (!editedData[product_id] || Object.keys(editedData[product_id]).length === 0) return;
    
        try {
            const productRef = doc(db, collectionName, product_id);
            const existingProduct = products.find((p) => p.product_id === product_id) || {};
    
            // Merge existing product data with edited data
            let updatedProduct = {
                ...existingProduct,
                ...editedData[product_id],
            };
    
            // Ensure variations are correctly merged
            const existingVariations = existingProduct.variation || [];
            const editedVariations = editedData[product_id].variation || [];
    
            updatedProduct.variation = [...existingVariations];
    
            editedVariations.forEach((editedVar, index) => {
                if (updatedProduct.variation[index]) {
                    // Merge existing variation
                    updatedProduct.variation[index] = {
                        color: editedVar.color ?? updatedProduct.variation[index].color ?? [],
                        size: editedVar.size?.map((size, i) => ({
                            name: size.name ?? updatedProduct.variation[index]?.size?.[i]?.name ?? "",
                            stock: size.stock ?? updatedProduct.variation[index]?.size?.[i]?.stock ?? 0,
                            sampleStock: size.sampleStock ?? updatedProduct.variation[index]?.size?.[i]?.sampleStock ?? 0,
                            price: size.price ?? updatedProduct.variation[index]?.size?.[i]?.price ?? 0,
                        })) || [],
                    };
                } else {
                    // Add new variation if it doesn't exist
                    updatedProduct.variation.push({
                        color: editedVar.color ?? [],
                        size: editedVar.size?.map((size) => ({
                            name: size.name ?? "",
                            stock: size.stock ?? 0,
                            sampleStock: size.sampleStock ?? 0,
                            price: size.price ?? 0,
                        })) || [],
                    });
                }
            });
    
            // Update Firestore
            await updateDoc(productRef, updatedProduct);
    
            // Update local state
            setProducts((prev) =>
                prev.map((p) => (p.product_id === product_id ? { ...p, ...updatedProduct } : p))
            );
    
            // Clear edited data for this product
            setEditedData((prev) => {
                const newData = { ...prev };
                delete newData[product_id];
                return newData;
            });
    
            console.log("Product updated successfully!");
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };
    
    

    const handleDelete = async (product_id) => {
        try {
            await deleteDoc(doc(db, collectionName, product_id));
            setProducts((prev) => prev.filter((p) => p.product_id !== product_id));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };



    // Define header columns. The "Variation" column is split into separate fields.
    const headers = [
        "Product Name",
        "Brand",
        "Attributes",
        "Space",
        "Finish",
        "Price",
        "Category",
        "Tag",
        "Thickness",
        "Tile Image URL",
        "Technical Image URL",
        "Variation Color",
        "Size Name",
        "Size Stock",
        "Size Price",
        "Size Sample Stock",
        "Short Description",
        "Reviews",
        "Image",
        "Highlighted Tile",
        "Rating",
        "Meta View URL",
        "Highlighter Render URL",
        "Location",
        "Pincode",
        "New",
        "Actions",
    ];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Product Management</h2>

            <button
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleAddProduct}
            >
                Add Product
            </button>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200 text-left">
                            {headers.map((header) => (
                                <th key={header} className="border p-3">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length} className="text-center p-4 text-gray-500">
                                    No products available.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.product_id} className="bg-white hover:bg-gray-100">
                                    {/* Normal fields */}
                                    {[
                                        { key: "name" },
                                        { key: "Brand" },
                                        { key: "attributes" },
                                        { key: "category" },
                                        { key: "finish" },
                                        { key: "price" },
                                        { key: "space" },
                                        { key: "tag" },
                                        { key: "thickness" },
                                        { key: "tileImage" },
                                        { key: "technicalImage" },
                                    ].map(({ key }) => (
                                        <td key={`${product.product_id}-${key}`} className="border p-2">
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={
                                                    editedData[product.product_id]?.[key] ??
                                                    (Array.isArray(product[key])
                                                        ? product[key].join(", ")
                                                        : product[key] ?? "")
                                                }
                                                onChange={(e) => handleChange(e, product.product_id, key)}
                                            />
                                        </td>
                                    ))}

                                    {/* Color */}
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={
                                                editedData[product.product_id]?.variation?.[0]?.color ??
                                                product.variation?.[0]?.color?.join(", ") ??
                                                ""
                                            }
                                            onChange={(e) => handleChange(e, product.product_id, "variation", "color")}
                                        />
                                    </td>

                                    {/* Sizes */}
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={
                                                editedData[product.product_id]?.variation?.[0]?.size?.map((s) => s.name).join(", ") ??
                                                product.variation?.[0]?.size?.map((s) => s.name).join(", ") ??
                                                ""
                                            }
                                            onChange={(e) => handleChange(e, product.product_id, "variation", "size")}
                                        />
                                    </td>

                                    {/* Stock */}
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={
                                                editedData[product.product_id]?.variation?.[0]?.size?.map((s) => s.stock).join(", ") ??
                                                product.variation?.[0]?.size?.map((s) => s.stock).join(", ") ??
                                                ""
                                            }
                                            onChange={(e) => handleChange(e, product.product_id, "variation", "stock")}
                                        />
                                    </td>

                                    {/* Sample Stock */}
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={
                                                editedData[product.product_id]?.variation?.[0]?.size?.map((s) => s.sampleStock).join(", ") ??
                                                product.variation?.[0]?.size?.map((s) => s.sampleStock).join(", ") ??
                                                ""
                                            }
                                            onChange={(e) => handleChange(e, product.product_id, "variation", "sampleStock")}
                                        />
                                    </td>

                                    {/* Price */}
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={
                                                editedData[product.product_id]?.variation?.[0]?.size?.map((s) => s.price).join(", ") ??
                                                product.variation?.[0]?.size?.map((s) => s.price).join(", ") ??
                                                ""
                                            }
                                            onChange={(e) => handleChange(e, product.product_id, "variation", "price")}
                                        />
                                    </td>



                                    {/* Remaining fields */}
                                    {[
                                        { key: "shortDescription" },
                                        { key: "reviews" },
                                        { key: "image" },
                                        { key: "highlightingTiles" },
                                        { key: "rating" },
                                        { key: "meta_view" },
                                        { key: "highlighterRendersURL" },
                                        { key: "location" },
                                        { key: "pin_code" },
                                        { key: "new" },
                                    ].map(({ key }) => (
                                        <td key={`${product.product_id}-${key}`} className="border p-2">
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded"
                                                value={
                                                    editedData[product.product_id]?.[key] ??
                                                    (Array.isArray(product[key])
                                                        ? product[key].join(", ")
                                                        : product[key] ?? "")
                                                }
                                                onChange={(e) => handleChange(e, product.product_id, key)}
                                            />
                                        </td>
                                    ))}
                                    {/* Actions */}
                                    <td className="border p-2 flex gap-2">
                                        <button
                                            className="bg-green-500 text-white px-3 py-1 rounded"
                                            onClick={() => handleSave(product.product_id)}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                            onClick={() => handleDelete(product.product_id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProductPage;
