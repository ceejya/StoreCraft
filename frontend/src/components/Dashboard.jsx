import { API_URL } from "../config"
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
    const token = localStorage.getItem("usertoken")
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState(null)
    const [products, setProducts] = useState([])
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [shopNameDraft, setShopNameDraft] = useState('')
    const [isSavingShopName, setIsSavingShopName] = useState(false)
    const [shopNameError, setShopNameError] = useState('')
    const [shopLinkCopied, setShopLinkCopied] = useState(false)

    const shopSlugPreview = shopNameDraft
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const handleShopNameSubmit = async (event) => {
        event.preventDefault()
        if (!shopSlugPreview || !token) return

        setIsSavingShopName(true)
        setShopNameError('')
        try {
            const response = await axios.patch(
                API_URL + "/user/shop-name",
                { storeName: shopNameDraft },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setCurrentUser(response.data.currentUser)
            setShopNameDraft(response.data.currentUser.storeName)
        } catch (error) {
            setShopNameError(error.response?.data?.message || 'Could not save your shop name. Please try again.')
        } finally {
            setIsSavingShopName(false)
        }
    }

    const shopLink = currentUser?.shopName
        ? `${window.location.origin}/shop/${currentUser.shopName}`
        : ''

    const handleCopyShopLink = async () => {
        try {
            await navigator.clipboard.writeText(shopLink)
            setShopLinkCopied(true)
            window.setTimeout(() => setShopLinkCopied(false), 1800)
        } catch {
            setShopNameError('Could not copy the link. Copy it from the link text instead.')
        }
    }


    useEffect(() => {
        axios.get(API_URL + "/user/verifytoken", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then((res) => {
                if (res.data?.currentUser) {
                    setCurrentUser(res.data.currentUser)
                    setShopNameDraft(res.data.currentUser.storeName || '')
                }
            })
            .catch((err) => {
                console.log(err)
                localStorage.removeItem("usertoken")
                navigate("/login")
            })

        axios.get(API_URL + "/product/mine", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => {
                if (res.data?.status) setProducts(res.data.products)
            })
            .catch((err) => console.log("Error fetching products:", err))
            .finally(() => setIsLoadingProducts(false))
    }, [navigate, token])

    const initials = currentUser?.username
        ? currentUser.username.slice(0, 2).toUpperCase()
        : '—'

    const totalValue = products.reduce((sum, p) => sum + (Number(p.productprice) * Number(p.stock)), 0)
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock), 0)

    return (
        <div className="sc-shell">
            {/* ── Sidebar ── */}
            <aside className="sc-sidebar d-none d-md-flex">
                <div className="sc-sidebar-head">
                    <div className="sc-logo">
                        <span className="sc-logo-mark">S</span>
                        <span className="sc-logo-text">StoreCraft</span>
                    </div>
                </div>

                <nav className="sc-nav" aria-label="Main navigation">
                    <a href="#" className="sc-nav-link sc-nav-link--active" aria-current="page">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                        Dashboard
                    </a>
                    <a href="/add-product" className="sc-nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        Products
                    </a>
                    <a href="#" className="sc-nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        Orders
                    </a>
                    <a href="/sendmessage" className="sc-nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Messages
                    </a>
                    <a href="#" className="sc-nav-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        Analytics
                    </a>
                </nav>

                <div className="sc-sidebar-foot">
                    <div className="sc-profile">
                        <span className="sc-avatar">{initials}</span>
                        <div className="sc-profile-meta">
                            <span className="sc-profile-name">{currentUser?.username || '…'}</span>
                            <span className="sc-profile-role">Seller</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Mobile top bar ── */}
            <header className="sc-mobile-bar d-md-none">
                <div className="sc-logo">
                    <span className="sc-logo-mark">S</span>
                    <span className="sc-logo-text">StoreCraft</span>
                </div>
                <div className="sc-mobile-actions">
                    <span className="sc-avatar sc-avatar--sm">{initials}</span>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="sc-main">
                {/* Page header */}
                <div className="sc-page-header">
                    <div>
                        <p className="sc-eyebrow">Overview</p>
                        <h1 className="sc-page-title">
                            {currentUser ? `Welcome back, ${currentUser.username}` : 'Dashboard'}
                        </h1>
                    </div>
                    <button
                        id="add-product-cta"
                        className="sc-btn"
                        onClick={() => navigate('/add-product')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        Add Product
                    </button>
                </div>

                {currentUser && (
                    <section className="sc-shop-setup" aria-labelledby="shop-setup-title">
                        <div className="sc-shop-setup-copy">
                            <p className="sc-eyebrow">Your public storefront</p>
                            <h2 id="shop-setup-title">Make this shop yours</h2>
                            <p>Customers can browse your public storefront without signing in. Rename it whenever you like—previously shared links will keep working.</p>
                        </div>
                        <form className="sc-shop-setup-form" onSubmit={handleShopNameSubmit}>
                            <label htmlFor="shop-name" className="sc-label">Store name</label>
                            <input
                                id="shop-name"
                                className="sc-input"
                                type="text"
                                value={shopNameDraft}
                                onChange={(event) => setShopNameDraft(event.target.value)}
                                placeholder="e.g. Amara Shoes"
                                autoComplete="organization"
                                required
                            />
                            <p className="sc-shop-link-preview">
                                {shopLink ? `Current link: ${shopLink}` : 'Your public link is being prepared.'}
                            </p>
                            <div className="sc-shop-setup-footer">
                                <button className="sc-btn" type="submit" disabled={!shopSlugPreview || isSavingShopName}>
                                    {isSavingShopName ? 'Saving…' : 'Save shop name'}
                                </button>
                                <button
                                    className="sc-btn-ghost"
                                    type="button"
                                    onClick={handleCopyShopLink}
                                    disabled={!shopLink}
                                >
                                    {shopLinkCopied ? 'Copied!' : 'Copy shop link'}
                                </button>
                            </div>
                            {shopNameError && <p role="alert" className="sc-shop-setup-note">{shopNameError}</p>}
                            <p className="sc-shop-setup-note">Old links automatically lead customers to your current storefront.</p>
                        </form>
                    </section>
                )}

                {/* Stats */}
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Products', value: products.length, accent: 'cobalt', icon: <><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></> },
                        { label: 'Inventory Value', value: `$${totalValue.toLocaleString()}`, accent: 'amber', icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/> },
                        { label: 'Stock Units', value: totalStock.toLocaleString(), accent: 'leather', icon: <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/> },
                        { label: 'Orders', value: '—', accent: 'rose', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
                    ].map((s, i) => (
                        <div key={i} className="col-6 col-xl-3">
                            <div className="sc-stat">
                                <div className={`sc-stat-icon sc-stat-icon--${s.accent}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                                </div>
                                <p className="sc-stat-label">{s.label}</p>
                                <p className="sc-stat-value">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Product listings */}
                <section className="sc-listings">
                    <div className="sc-listings-head">
                        <h2 className="sc-listings-title">Your Listings</h2>
                        <span className="sc-listings-count">{products.length} item{products.length !== 1 ? 's' : ''}</span>
                    </div>

                    {isLoadingProducts ? (
                        <div className="row g-3">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="col-12 col-sm-6 col-lg-4">
                                    <div className="sc-skel">
                                        <div className="sc-skel-img"/>
                                        <div className="sc-skel-body">
                                            <div className="sc-skel-bar sc-skel-bar--lg"/>
                                            <div className="sc-skel-bar sc-skel-bar--md"/>
                                            <div className="sc-skel-bar sc-skel-bar--sm"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="sc-empty">
                            <div className="sc-empty-circle">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            </div>
                            <h3 className="sc-empty-heading">No products yet</h3>
                            <p className="sc-empty-body">Add your first product to start selling.</p>
                            <button className="sc-btn" onClick={() => navigate('/add-product')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                Add your first product
                            </button>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {products.map(product => (
                                <div key={product._id} className="col-12 col-sm-6 col-lg-4">
                                    <article className="sc-card">
                                        <div className="sc-card-visual">
                                            <img src={product.productimage} alt={product.productname} className="sc-card-img" loading="lazy"/>
                                            <span className={`sc-badge ${Number(product.stock) === 0 ? 'sc-badge--out' : ''}`}>
                                                {Number(product.stock) === 0 ? 'Sold out' : `${product.stock} in stock`}
                                            </span>
                                        </div>
                                        <div className="sc-card-body">
                                            <h3 className="sc-card-name">{product.productname}</h3>
                                            <p className="sc-card-desc">{product.productdescription}</p>
                                            <div className="sc-card-foot">
                                                <span className="sc-card-price">${Number(product.productprice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                <button className="sc-card-menu" aria-label={`Options for ${product.productname}`}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

export default Dashboard
