import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {

    const token = localStorage.getItem("usertoken")
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState(null)
    const [products, setProducts] = useState([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)




    useEffect(() => {
        // Verify User Token
        axios.get("http://localhost:8004/user/verifytoken", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((res) => {
                if (res) {
                    setCurrentUser(res.data.currentUser)
                }
            }).catch((err) => {
                console.log(err);
                localStorage.removeItem("usertoken")
                navigate("/login")
            })

        // Fetch products from backend
        axios.get("http://localhost:8004/product/fetch/product")
            .then((res) => {
                if (res.data && res.data.allproducts) {
                    setProducts(res.data.allproducts)
                }
            })
            .catch((err) => {
                console.log("Error fetching products:", err)
            })
            .finally(() => {
                setIsLoadingProducts(false)
            })
    }, [])





    return (
        <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h1>Dashboard {currentUser && `- Welcome ${currentUser.username}`}</h1>
                <button
                    onClick={() => navigate("/add-product")}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600"
                    }}
                >
                    + Add Product
                </button>
            </div>

            <h2 style={{ marginBottom: "20px" }}>Products</h2>

            {isLoadingProducts ? (
                <p>Loading products...</p>
            ) : products.length === 0 ? (
                <p>No products available yet. Click "+ Add Product" to create one.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
                    {products.map((product) => (
                        <div key={product._id} style={{
                            border: "1px solid #dfe6f0",
                            borderRadius: "10px",
                            padding: "16px",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }}>
                            <img
                                src={product.productimage}
                                alt={product.productname}
                                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }}
                            />
                            <h3 style={{ marginTop: "14px", marginBottom: "6px", fontSize: "1.2rem" }}>{product.productname}</h3>
                            <p style={{ color: "#64748b", fontSize: "0.9rem", height: "38px", overflow: "hidden", marginBottom: "14px" }}>
                                {product.productdescription}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                                <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "#2563eb" }}>
                                    ${product.productprice}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#475569", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px" }}>
                                    Stock: {product.stock}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}



        </div>
    )
}

export default Dashboard