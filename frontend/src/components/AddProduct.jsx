import React from "react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const AddProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [productinfo, setProductinfo] = useState({
    productname: "",
    productprice: "",
    stock: "",
    productimage: "",
    productdescription: "",
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image is too large! Please choose an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductinfo({ ...productinfo, productimage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleproduct = async () => {
    const { productname, productprice, stock, productdescription, productimage } = productinfo;

    if (!productname || !productprice || !stock || !productdescription || !productimage) {
      toast.error("Please fill in all required fields and upload an image.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:8004/product/addproducts", productinfo);
      console.log(response);
      toast.success(response.data.message);

      setProductinfo({
        productname: "",
        productprice: "",
        stock: "",
        productimage: "",
        
        productdescription: ""
      });
    } catch (error) {
      const errormessage = error?.response?.data?.message || "Failed to add product";
      toast.error(errormessage);
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // const reader = new FileReader()
  // reader.onloadend = () => setProductinfo({ ...productinfo, productimage: reader.result }); reader.readAsDataURL(file);



  return (
    <main className="add-product-page">
      <section className="add-product-shell">
        <div className="add-product-header">
          <div>
            <p className="add-product-eyebrow">Inventory</p>
            <h1>Add Product</h1>
          </div>
        </div>

        <form className="add-product-form">
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="productname">Product name</label>
              <input
                id="productname"
                name="productname"
                type="text"
                value={productinfo.productname}
                onChange={(e) => setProductinfo({ ...productinfo, productname: e.target.value })}

                placeholder="Enter product name"
              />
            </div>

            <div className="field-group">
              <label htmlFor="productprice">Product price</label>
              <input
                id="productprice"
                name="productprice"
                type="number"
                min="0"
                value={productinfo.productprice}
                onChange={(e) => setProductinfo({ ...productinfo, productprice: e.target.value })}
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="field-group">
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={productinfo.stock}
                onChange={(e) => setProductinfo({ ...productinfo, stock: e.target.value })}
                placeholder="Available quantity"
              />
            </div>
          </div>

          <div className="form-grid product-details-grid">
            <div className="field-group description-field">
              <label htmlFor="productdescription">Product description</label>
              <textarea
                id="productdescription"
                name="productdescription"
                value={productinfo.productdescription}
                onChange={(e) => setProductinfo({ ...productinfo, productdescription: e.target.value })}
                placeholder="Write a clear description of the product"
              />
            </div>

            <div className="field-group image-field">
              <label htmlFor="productimage">Product image</label>

              {/* Change <button> to <label htmlFor="productimage"> */}
              <label htmlFor="productimage" className="upload-box">
                {/* <span className="upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M12 3.75 17.25 9l-1.06 1.06-3.44-3.43v9.62h-1.5V6.63l-3.44 3.43L6.75 9 12 3.75Z" />
                    <path d="M5.25 18.75h13.5v-4.5h1.5v6H3.75v-6h1.5v4.5Z" />
                  </svg>
                </span>
                <strong>Upload product image</strong>
                <span>Click to choose an image</span> */}
                {productinfo.productimage ? (
                  <img src={productinfo.productimage} alt="preview" style={{ width: "100%", height: "180px", objectFit: "cover" }} />

                ) : (
                  <><span className="upload-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="img">
                      <path d="M12 3.75 17.25 9l-1.06 1.06-3.44-3.43v9.62h-1.5V6.63l-3.44 3.43L6.75 9 12 3.75Z" />
                      <path d="M5.25 18.75h13.5v-4.5h1.5v6H3.75v-6h1.5v4.5Z" />
                    </svg>
                  </span>
                    <strong>Upload product image</strong>
                    <span>Click to choose an image</span>
                  </>)}
              </label>



              <input
                id="productimage"
                name="productimage"
                type="file"
                placeholder="okayyy"
                accept="image/*"
                className="visually-hidden-file"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleproduct} disabled={isLoading} className="submit-product-btn" type="button">
              {isLoading ? "Adding product..." : "Add product"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default AddProduct;