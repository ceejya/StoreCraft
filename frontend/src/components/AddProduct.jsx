import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddProduct = () => {
  const navigate = useNavigate();
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

  return (
    <main className="sc-form-page">
      {/* Back link */}
      <div className="container-fluid" style={{ maxWidth: 980 }}>
        <a href="/Dashboard" className="sc-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Dashboard
        </a>
      </div>

      <section className="sc-form-shell container-fluid" style={{ maxWidth: 980 }}>
        {/* Header */}
        <div className="sc-form-header">
          <div>
            <p className="sc-eyebrow">Inventory</p>
            <h1 className="sc-page-title">Add Product</h1>
          </div>
        </div>

        <form className="sc-form-body" onSubmit={(e) => e.preventDefault()}>
          {/* Basic info row */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="sc-field">
                <label htmlFor="productname" className="sc-label">Product name</label>
                <input
                  id="productname"
                  className="sc-input"
                  type="text"
                  value={productinfo.productname}
                  onChange={(e) => setProductinfo({ ...productinfo, productname: e.target.value })}
                  placeholder="e.g. Ceramic Mug"
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="sc-field">
                <label htmlFor="productprice" className="sc-label">Price</label>
                <div className="sc-input-prefix-wrap">
                  <span className="sc-input-prefix">$</span>
                  <input
                    id="productprice"
                    className="sc-input sc-input--prefixed"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productinfo.productprice}
                    onChange={(e) => setProductinfo({ ...productinfo, productprice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="sc-field">
                <label htmlFor="stock" className="sc-label">Stock quantity</label>
                <input
                  id="stock"
                  className="sc-input"
                  type="number"
                  min="0"
                  value={productinfo.stock}
                  onChange={(e) => setProductinfo({ ...productinfo, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Description + Image */}
          <div className="row g-3">
            <div className="col-12 col-md-7">
              <div className="sc-field">
                <label htmlFor="productdescription" className="sc-label">Description</label>
                <textarea
                  id="productdescription"
                  className="sc-textarea"
                  value={productinfo.productdescription}
                  onChange={(e) => setProductinfo({ ...productinfo, productdescription: e.target.value })}
                  placeholder="Describe your product – materials, dimensions, care instructions…"
                />
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div className="sc-field">
                <label className="sc-label">Product image</label>
                <label
                  htmlFor="productimage"
                  className={`sc-upload ${productinfo.productimage ? 'sc-upload--has' : ''}`}
                  tabIndex={0}
                >
                  {productinfo.productimage ? (
                    <>
                      <img src={productinfo.productimage} alt="Preview" className="sc-upload-preview"/>
                      <span className="sc-upload-change">Click to change image</span>
                    </>
                  ) : (
                    <>
                      <span className="sc-upload-icon" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3.75 17.25 9l-1.06 1.06-3.44-3.43v9.62h-1.5V6.63l-3.44 3.43L6.75 9 12 3.75Z"/>
                          <path d="M5.25 18.75h13.5v-4.5h1.5v6H3.75v-6h1.5v4.5Z"/>
                        </svg>
                      </span>
                      <strong className="sc-upload-label">Upload product image</strong>
                      <span className="sc-upload-hint">JPG, PNG or WebP · max 5 MB</span>
                    </>
                  )}
                </label>
                <input
                  id="productimage"
                  type="file"
                  accept="image/*"
                  className="visually-hidden-file"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="sc-form-actions">
            <button
              type="button"
              className="sc-btn-ghost"
              onClick={() => navigate('/Dashboard')}
            >
              Cancel
            </button>
            <button
              onClick={handleproduct}
              disabled={isLoading}
              className="sc-btn"
              type="button"
            >
              {isLoading ? (
                <><span className="sc-spinner" aria-hidden="true"/>Adding…</>
              ) : (
                'Add product'
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default AddProduct;