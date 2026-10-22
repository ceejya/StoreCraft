import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"

/* Demo catalog for the hero preview. Mirrors the public storefront's
   customer-facing fields only (name, price, stock, image). */
const DEMO_PRODUCTS = [
    { id: "vase", name: "Cobalt bud vase", price: 48, stock: 3, img: "/landing/vase.jpg" },
    { id: "journal", name: "Leather field journal", price: 36, stock: 0, img: "/landing/journal.jpg" },
    { id: "mug", name: "Speckled stoneware mug", price: 24, stock: 12, img: "/landing/mug.jpg" },
]

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const ProductImage = ({ src, alt }) => {
    const [failed, setFailed] = useState(false)
    if (failed) {
        return <div className="lp-card-img lp-card-img--fallback" role="img" aria-label={alt} />
    }
    return (
        <img
            className="lp-card-img"
            src={src}
            alt={alt}
            width="320"
            height="320"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
        />
    )
}

const StorefrontPreview = () => {
    const [bag, setBag] = useState({})
    const [announcement, setAnnouncement] = useState("")
    const [pulse, setPulse] = useState(false)

    const count = Object.values(bag).reduce((a, b) => a + b, 0)

    useEffect(() => {
        if (!pulse) return
        const t = setTimeout(() => setPulse(false), 400)
        return () => clearTimeout(t)
    }, [pulse])

    const add = (p) => {
        const inBag = bag[p.id] || 0
        if (inBag >= p.stock) return
        setBag({ ...bag, [p.id]: inBag + 1 })
        setAnnouncement(`Added ${p.name} to the bag. ${count + 1} in bag.`)
        setPulse(true)
    }

    return (
        <figure className="lp-preview" aria-labelledby="lp-preview-caption">
            <div className="lp-browser">
                <div className="lp-browser-bar">
                    <span className="lp-dots" aria-hidden="true"><i /><i /><i /></span>
                    <span className="lp-url">storecraft.app/shop/<b>ama-studio</b></span>
                </div>

                <div className="lp-shop">
                    <div className="lp-shop-head">
                        <div>
                            <p className="lp-shop-name">Ama Studio</p>
                            <p className="lp-shop-by">Ceramics &amp; paper goods</p>
                        </div>
                        <span className={`lp-bag ${pulse ? "is-pulse" : ""}`}>
                            Bag <span className="lp-bag-count">{count}</span>
                        </span>
                    </div>

                    <ul className="lp-grid">
                        {DEMO_PRODUCTS.map((p) => {
                            const inBag = bag[p.id] || 0
                            const soldOut = p.stock === 0
                            const maxed = !soldOut && inBag >= p.stock
                            return (
                                <li key={p.id} className={`lp-card ${soldOut ? "is-out" : ""}`}>
                                    <ProductImage src={p.img} alt={p.name} />
                                    <p className="lp-card-name">{p.name}</p>
                                    <p className="lp-card-meta">
                                        <span className="lp-price">{money.format(p.price)}</span>
                                        <span className={`lp-stock ${soldOut ? "is-out" : p.stock <= 5 ? "is-low" : ""}`}>
                                            {soldOut ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}
                                        </span>
                                    </p>
                                    <button
                                        type="button"
                                        className="lp-add"
                                        onClick={() => add(p)}
                                        disabled={soldOut || maxed}
                                        aria-label={`Add ${p.name} to bag`}
                                    >
                                        {soldOut ? "Sold out" : maxed ? "All in bag" : "Add to bag"}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            <figcaption id="lp-preview-caption" className="lp-preview-caption">
                A sample storefront. Try adding something to the bag.
            </figcaption>
            <p className="lp-sr" aria-live="polite">{announcement}</p>
        </figure>
    )
}

const Landing = () => {
    useEffect(() => {
        document.title = "StoreCraft: a storefront you can share in one link"
        let meta = document.querySelector('meta[name="description"]')
        if (!meta) {
            meta = document.createElement("meta")
            meta.name = "description"
            document.head.appendChild(meta)
        }
        meta.content = "Create a free StoreCraft shop, list your products, and share one link. Customers can search your catalog and fill a bag."
    }, [])

    return (
        <div className="lp">
            <a className="lp-skip" href="#lp-main">Skip to content</a>

            <header className="lp-header">
                <Link to="/" className="lp-wordmark" aria-label="StoreCraft home">
                    <span className="lp-mark" aria-hidden="true">S</span>
                    StoreCraft
                </Link>
                <nav aria-label="Account">
                    <Link to="/login" className="lp-nav-link">Log in</Link>
                </nav>
            </header>

            <main id="lp-main" className="lp-hero">
                <div className="lp-copy">
                    <h1 className="lp-title">
                        Your shop, <span className="lp-title-accent">one link</span> away.
                    </h1>
                    <p className="lp-sub">
                        List what you make, get a public storefront, and send the link anywhere.
                        Customers search your catalog and fill a bag. Rename your shop any time
                        and old links keep working.
                    </p>
                    <div className="lp-actions">
                        <Link to="/signup" className="lp-cta">Create your free shop</Link>
                        <Link to="/login" className="lp-cta-secondary">I already have a shop</Link>
                    </div>
                    <p className="lp-note">Online checkout is coming soon. For now, customers browse and build a bag.</p>
                </div>

                <StorefrontPreview />
            </main>

            <footer className="lp-footer">
                <span>© {new Date().getFullYear()} StoreCraft</span>
                <Link to="/signup" className="lp-nav-link">Create your free shop</Link>
            </footer>
        </div>
    )
}

export default Landing
