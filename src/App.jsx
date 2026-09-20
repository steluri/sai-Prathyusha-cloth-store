import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Menu, Minus, Plus,
  Search, ShoppingBag, Sparkles, Truck, X,
} from 'lucide-react'
import { apiUrl, assetUrl } from './api'

const money = value => `₹${Number(value).toLocaleString('en-IN')}`

let razorpayLoader
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  if (!razorpayLoader) {
    razorpayLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = resolve
      script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'))
      document.body.appendChild(script)
    })
  }
  return razorpayLoader
}

const mensCollections = [
  { name: 'Shirts', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85' },
  { name: 'Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85' },
  { name: 'Trousers', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=85' },
  { name: 'T-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85' },
  { name: 'Kurtas', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85' },
  { name: 'Dhotis', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85' },
  { name: 'Inners', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85' },
  { name: 'Boys Collections', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85' },
  { name: 'All Products', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85' },
]

const womensCollections = [
  { name: 'Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Kurtis', image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85' },
  { name: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85' },
  { name: 'Tops', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85' },
  { name: 'Chudidars', image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=85' },
  { name: 'Inners', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85' },
  { name: 'Girls Collections', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=85' },
  { name: 'All Products', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85' },
]

const collectionMatchers = {
  Men: {
    Shirts: /shirt|collar/i,
    Jeans: /jean|denim/i,
    Trousers: /trouser|pant/i,
    'T-shirts': /t-shirt|tee|polo/i,
    Kurtas: /kurta/i,
    Dhotis: /dhoti/i,
    Inners: /inner|brief|vest/i,
    'Boys Collections': /boy|junior/i,
  },
  Women: {
    Sarees: /saree/i,
    Kurtis: /kurti|kurta|co-ord/i,
    Dresses: /dress/i,
    Tops: /top|shirt|blouse/i,
    Jeans: /jean|denim/i,
    Chudidars: /chudidar|salwar|trouser/i,
    Inners: /inner|bra|lingerie/i,
    'Girls Collections': /girl|junior/i,
  },
}

function matchesCollection(product, audience, type) {
  if (product.category !== audience) return false
  if (type === 'All Products') return true
  return collectionMatchers[audience]?.[type]?.test(`${product.name} ${product.description || ''}`) || false
}

function App() {
  const [products, setProducts] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('Pandu-cart') || '[]'))
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Featured')
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [collectionView, setCollectionView] = useState(null)
  const [minimumPrice, setMinimumPrice] = useState('')
  const [maximumPrice, setMaximumPrice] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [saleOnly, setSaleOnly] = useState(false)

  useEffect(() => {
    Promise.all([fetch(apiUrl('/api/products')).then(r => r.json()), fetch(apiUrl('/api/wishlist')).then(r => r.json())])
      .then(([catalog, saved]) => { setProducts(catalog); setWishlist(saved.map(p => p.id)) })
      .catch(() => setToast('Start the Python API to load the collection.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => localStorage.setItem('Pandu-cart', JSON.stringify(cart)), [cart])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(id)
  }, [toast])

  const visibleProducts = useMemo(() => {
    let list = products.filter(p => (category === 'All' || p.category === category) &&
      `${p.name} ${p.color}`.toLowerCase().includes(search.toLowerCase()))
    if (sort === 'Price: Low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to low') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [products, category, search, sort])

  const collectionBaseProducts = useMemo(() => {
    if (!collectionView) return []
    return products.filter(product => matchesCollection(product, collectionView.audience, collectionView.type) &&
      `${product.name} ${product.color}`.toLowerCase().includes(search.toLowerCase()))
  }, [products, collectionView, search])

  const collectionProducts = useMemo(() => {
    let list = collectionBaseProducts.filter(product =>
      (!minimumPrice || Number(product.price) >= Number(minimumPrice)) &&
      (!maximumPrice || Number(product.price) <= Number(maximumPrice)) &&
      (!selectedColor || product.color === selectedColor) &&
      (!saleOnly || product.old_price))
    if (sort === 'Price: Low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to low') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [collectionBaseProducts, minimumPrice, maximumPrice, selectedColor, saleOnly, sort])

  const collectionColors = useMemo(() => [...new Set(collectionBaseProducts.map(product => product.color))], [collectionBaseProducts])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function notify(message) { setToast(''); setTimeout(() => setToast(message), 10) }

  function addToCart(product) {
    setCart(current => {
      const found = current.find(item => item.id === product.id)
      return found
        ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    notify(`${product.name} added to your bag`)
  }

  function changeQuantity(id, delta) {
    setCart(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0))
  }

  async function toggleWishlist(product) {
    const saved = wishlist.includes(product.id)
    setWishlist(current => saved ? current.filter(id => id !== product.id) : [...current, product.id])
    try {
      await fetch(apiUrl(`/api/wishlist/${product.id}`), { method: saved ? 'DELETE' : 'POST' })
      notify(saved ? 'Removed from wishlist' : 'Saved to your wishlist')
    } catch {
      setWishlist(current => saved ? [...current, product.id] : current.filter(id => id !== product.id))
      notify('Could not update wishlist')
    }
  }

  function shopCategory(next) {
    setCollectionView(null)
    setCategory(next)
    window.requestAnimationFrame(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }))
    setMobileOpen(false)
  }

  function openCollection(audience, type) {
    if (collectionView?.audience !== audience) {
      setSelectedColor('')
      setSaleOnly(false)
    }
    setCollectionView({ audience, type })
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearCatalogFilters() {
    setMinimumPrice('')
    setMaximumPrice('')
    setSelectedColor('')
    setSaleOnly(false)
  }

  const collectionTabs = collectionView?.audience === 'Women' ? womensCollections : mensCollections

  return (
    <div className="site-shell">
      <div className="announcement">Free shipping on orders over ₹2,999 <span>•</span> Easy 14-day returns</div>
      <header className="header">
        <button className="icon-btn mobile-menu" aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={21} /></button>
        <a className="logo" href="#top" onClick={() => setCollectionView(null)}>Pandu<span>.</span></a>
        <nav className={mobileOpen ? 'nav open' : 'nav'}>
          <button onClick={() => shopCategory('Women')}>Women</button>
          <button onClick={() => shopCategory('Men')}>Men</button>
          <button onClick={() => shopCategory('All')}>New arrivals</button>
          <button onClick={() => shopCategory('All')}>The edit</button>
        </nav>
        <div className="header-actions">
          <label className="header-search"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" /></label>
          <button className="icon-btn" aria-label="Wishlist" onClick={() => setWishlistOpen(true)}><Heart size={20} /><Count value={wishlist.length} /></button>
          <button className="icon-btn" aria-label="Shopping bag" onClick={() => setCartOpen(true)}><ShoppingBag size={20} /><Count value={cartCount} /></button>
        </div>
      </header>

      {collectionView && <main className="collection-page">
        <div className="catalog-layout">
          <aside className="catalog-filters">
            <div className="filter-heading"><strong>Filters</strong><button onClick={clearCatalogFilters}>Clear all</button></div>
            <div className="filter-section price-filter">
              <strong>Price</strong>
              <div className="price-track"><span /><span /></div>
              <div className="price-inputs">
                <label>Minimum<input type="number" min="0" value={minimumPrice} onChange={e => setMinimumPrice(e.target.value)} placeholder="₹0" /></label>
                <label>Maximum<input type="number" min="0" value={maximumPrice} onChange={e => setMaximumPrice(e.target.value)} placeholder="₹10000" /></label>
              </div>
            </div>
            <div className="filter-section">
              <strong>Color</strong>
              <div className="filter-options">
                {collectionColors.length ? collectionColors.map(color => <button className={selectedColor === color ? 'active' : ''} key={color} onClick={() => setSelectedColor(selectedColor === color ? '' : color)}><span />{color}</button>) : <p>No colors available</p>}
              </div>
            </div>
            <div className="filter-section">
              <strong>Offers</strong>
              <label className="filter-check"><input type="checkbox" checked={saleOnly} onChange={e => setSaleOnly(e.target.checked)} /> On sale</label>
            </div>
            <div className="filter-summary-row"><span>Gender</span><strong>{collectionView.audience}</strong></div>
            <div className="filter-summary-row"><span>Type</span><strong>{collectionView.type}</strong></div>
          </aside>

          <section className="catalog-results">
            <button className="collection-back" onClick={() => { setCollectionView(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><ArrowLeft size={17} /> Back to home</button>
            <div className="shop-for">
              <strong>Shop for</strong>
              {['Women', 'Men'].map(audience => <button className={collectionView.audience === audience ? 'active' : ''} key={audience} onClick={() => openCollection(audience, 'All Products')}>{audience}</button>)}
            </div>
            <div className="catalog-query-row">
              <p><strong>You searched for “{collectionView.type}”</strong><span>· {collectionProducts.length} products available</span></p>
              <label className="catalog-sort"><strong>Sort by</strong><span><select value={sort} onChange={e => setSort(e.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={16} /></span></label>
            </div>
            <div className="collection-type-tabs" role="tablist" aria-label={`${collectionView.audience} collection types`}>
              {collectionTabs.map(item => <button role="tab" aria-selected={collectionView.type === item.name} className={collectionView.type === item.name ? 'active' : ''} key={item.name} onClick={() => openCollection(collectionView.audience, item.name)}>{item.name}</button>)}
            </div>
            {loading ? <div className="loading-grid">{Array.from({ length: 8 }).map((_, i) => <div className="skeleton" key={i} />)}</div> :
              collectionProducts.length ? <div className="product-grid">
                {collectionProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onSave={() => toggleWishlist(product)} onAdd={() => addToCart(product)} />)}
              </div> : <div className="empty-search"><Search size={28} /><h3>No products match these filters</h3><p>Clear the filters or choose another collection type.</p></div>}
          </section>
        </div>
      </main>}

      <main id="top" className={collectionView ? 'home-view-hidden' : ''}>
        <section className="hero">
          <img src="/atelier-hero.png" alt="Models wearing Pandu's warm neutral collection" />
          <div className="hero-copy">
            <p className="eyebrow">The September edit</p>
            <h1>Everyday,<br /><em>considered.</em></h1>
            <p>Natural textures, thoughtful shapes, and quietly confident pieces made to live in.</p>
            <div className="hero-buttons">
              <button className="button dark" onClick={() => shopCategory('Women')}>Shop women <ArrowRight size={17} /></button>
              <button className="button text-button" onClick={() => shopCategory('Men')}>Shop men <ArrowRight size={17} /></button>
            </div>
          </div>
          <div className="hero-note"><span>01</span><p>New forms<br />in soft focus</p></div>
        </section>

        <section className="values">
          <div><Sparkles size={22} /><p><strong>Considered design</strong><span>Fewer, better pieces for every day.</span></p></div>
          <div><Truck size={23} /><p><strong>Complimentary delivery</strong><span>On all orders over ₹2,999.</span></p></div>
          <div><Check size={22} /><p><strong>Easy returns</strong><span>14 days to change your mind.</span></p></div>
        </section>

        <section className="collection" id="shop">
          <div className="section-heading">
            <div><p className="eyebrow">Curated for now</p><h2>The new collection</h2></div>
            <p>Clean lines meet lived-in comfort. Discover pieces that work wherever the day takes you.</p>
          </div>
          <div className="toolbar">
            <div className="category-tabs">
              {['All', 'Women', 'Men'].map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <label className="sort">Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={15} /></label>
          </div>

          {loading ? <div className="loading-grid">{Array.from({ length: 8 }).map((_, i) => <div className="skeleton" key={i} />)}</div> :
            visibleProducts.length ? <div className="product-grid">
              {visibleProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} onSave={() => toggleWishlist(product)} onAdd={() => addToCart(product)} />)}
            </div> : <div className="empty-search"><Search size={28} /><h3>No pieces found</h3><p>Try a different search or category.</p></div>}
        </section>

        <section className="mens-collections womens-collections" aria-labelledby="womens-collections-title">
          <div className="mens-collections-heading">
            <div>
              <p className="eyebrow">Made for every moment</p>
              <h2 id="womens-collections-title">Womens Collections</h2>
            </div>
            <p>From everyday favourites to festive silhouettes, discover styles selected for women and girls.</p>
          </div>
          <div className="mens-collection-grid">
            {womensCollections.map(item => (
              <button className="mens-collection-card" key={item.name} onClick={() => openCollection('Women', item.name)}>
                <span className="mens-collection-image"><img src={item.image} alt="" loading="lazy" /></span>
                <span>{item.name}<ArrowRight size={17} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="mens-collections" aria-labelledby="mens-collections-title">
          <div className="mens-collections-heading">
            <div>
              <p className="eyebrow">Find your style</p>
              <h2 id="mens-collections-title">Mens Collections</h2>
            </div>
            <p>Everyday essentials and traditional favourites, thoughtfully selected for men and boys.</p>
          </div>
          <div className="mens-collection-grid">
            {mensCollections.map(item => (
              <button className="mens-collection-card" key={item.name} onClick={() => openCollection('Men', item.name)}>
                <span className="mens-collection-image"><img src={item.image} alt="" loading="lazy" /></span>
                <span>{item.name}<ArrowRight size={17} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="story">
          <div className="story-image"><div className="material-card"><span>01</span><strong>Natural fibres</strong><p>Breathable, tactile, enduring.</p></div></div>
          <div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Made with intention.<br /><em>Worn with ease.</em></h2><p>We believe getting dressed should feel simple. That means considered silhouettes, honest materials, and a palette that moves effortlessly through your wardrobe.</p><button className="button outline" onClick={() => shopCategory('All')}>Discover our story <ArrowRight size={17} /></button></div>
        </section>

        <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>Notes from the studio</h2><p>New arrivals, quiet inspiration, and 10% off your first order.</p><form onSubmit={e => { e.preventDefault(); notify('Welcome to the Pandu community') }}><input type="email" required placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></section>
      </main>

      <footer><a className="logo" href="#top" onClick={() => setCollectionView(null)}>Pandu<span>.</span></a><p>Clothes for living, thoughtfully made.</p><div><a href="#shop" onClick={() => setCollectionView(null)}>Shop</a><a href="#top" onClick={() => setCollectionView(null)}>About</a><a href="mailto:hello@Pandu.store">Contact</a></div><small>© 2026 Pandu Studio</small></footer>

      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Your bag" count={cartCount}>
        {!cart.length ? <Empty icon={<ShoppingBag />} title="Your bag is empty" text="Good things are waiting." action={() => { setCartOpen(false); shopCategory('All') }} /> : <>
          <div className="drawer-items">{cart.map(item => <CartItem key={item.id} item={item} onChange={delta => changeQuantity(item.id, delta)} />)}</div>
          <div className="cart-summary"><div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p>Taxes included. Shipping calculated at checkout.</p><button className="button dark wide" onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}>Continue to checkout <ArrowRight size={17} /></button></div>
        </>}
      </Drawer>

      <Drawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} title="Your wishlist" count={wishlist.length}>
        {!wishlist.length ? <Empty icon={<Heart />} title="Nothing saved yet" text="Tap the heart on pieces you love." action={() => { setWishlistOpen(false); shopCategory('All') }} /> : <div className="drawer-items">{products.filter(p => wishlist.includes(p.id)).map(item => <div className="saved-item" key={item.id}><img src={assetUrl(item.image)} alt={item.name} /><div><h4>{item.name}</h4><p>{item.color}</p><strong>{money(item.price)}</strong><button onClick={() => { addToCart(item); setWishlistOpen(false); setCartOpen(true) }}>Add to bag</button></div><button className="remove" onClick={() => toggleWishlist(item)}><X size={16} /></button></div>)}</div>}
      </Drawer>

      {checkoutOpen && <Checkout total={cartTotal} cart={cart} onClose={() => setCheckoutOpen(false)} onComplete={order => { setCart([]); setCheckoutOpen(false); notify(`Order AV-${String(order.order_id).padStart(4, '0')} confirmed — thank you!`) }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

function Count({ value }) { return value ? <span className="count">{value}</span> : null }

function ProductCard({ product, saved, onSave, onAdd }) {
  return <article className="product-card">
    <div className="product-image"><img src={assetUrl(product.image)} alt={product.name} loading="lazy" />{product.badge && <span className="badge">{product.badge}</span>}<button className={`save ${saved ? 'saved' : ''}`} onClick={onSave} aria-label="Save to wishlist"><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={onAdd}>Quick add <Plus size={16} /></button></div>
    <div className="product-info"><div><h3>{product.name}</h3><p>{product.color}</p></div><div className="price"><strong>{money(product.price)}</strong>{product.old_price && <s>{money(product.old_price)}</s>}</div></div>
  </article>
}

function Drawer({ open, onClose, title, count, children }) {
  return <div className={`drawer-wrap ${open ? 'show' : ''}`} aria-hidden={!open}><button className="scrim" onClick={onClose} aria-label="Close" /><aside className="drawer"><div className="drawer-head"><h2>{title} <span>{count}</span></h2><button className="icon-btn" onClick={onClose}><X /></button></div>{children}</aside></div>
}

function CartItem({ item, onChange }) {
  return <div className="cart-item"><img src={assetUrl(item.image)} alt={item.name} /><div><h4>{item.name}</h4><p>{item.color} · One size</p><strong>{money(item.price)}</strong><div className="quantity"><button onClick={() => onChange(-1)}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => onChange(1)}><Plus size={13} /></button></div></div><button className="remove" onClick={() => onChange(-item.quantity)}><X size={16} /></button></div>
}

function Empty({ icon, title, text, action }) { return <div className="empty">{icon}<h3>{title}</h3><p>{text}</p><button className="button dark" onClick={action}>Explore collection</button></div> }

function Checkout({ total, cart, onClose, onComplete }) {
  const [step, setStep] = useState('contact')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState({ door: '', line1: '', line2: '', city: '', pincode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function request(path, body) {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
    return data
  }

  async function beginPayment(e) {
    e.preventDefault(); setSubmitting(true); setError('')
    try {
      await loadRazorpay()
      const paymentOrder = await request('/api/payments/razorpay/order', {
        customer: name,
        mobile,
        address,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
      })
      const checkout = new window.Razorpay({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Pandu',
        description: 'Clothing order',
        order_id: paymentOrder.order_id,
        prefill: paymentOrder.prefill,
        theme: { color: '#a95f36' },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI or QR',
                instruments: [{ method: 'upi' }],
              },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async payment => {
          try {
            const order = await request('/api/orders', payment)
            onComplete(order)
          } catch (err) {
            setError(err.message || 'Payment verification failed. Please contact support.')
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. You can try again when you’re ready.')
            setSubmitting(false)
          },
        },
      })
      checkout.on('payment.failed', response => {
        setError(response.error?.description || 'Payment failed. Please try another payment method.')
        setSubmitting(false)
      })
      checkout.open()
    } catch (err) { setError(err.message || 'Checkout failed. Please try again.'); setSubmitting(false) }
  }

  function updateAddress(field, value) {
    setAddress(current => ({ ...current, [field]: value }))
  }

  return <div className="modal-wrap"><button className="scrim" onClick={onClose} aria-label="Close checkout" /><div className="checkout-modal"><button className="modal-close" onClick={onClose} aria-label="Close checkout"><X /></button><p className="eyebrow">Secure checkout · {step === 'contact' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
    {step === 'contact' ? <><h2>Your details.</h2><p className="checkout-intro">Tell us who the order is for.</p><form onSubmit={e => { e.preventDefault(); setError(''); setStep('address') }}><label>Full name<input name="name" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label><label>Mobile number<div className="mobile-input"><span>+91</span><input name="mobile" type="tel" inputMode="numeric" autoComplete="tel" required maxLength="10" pattern="[6-9][0-9]{9}" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" /></div></label>{error && <p className="form-error">{error}</p>}<button className="button dark wide">Continue to address <ArrowRight size={17} /></button></form></> : <><h2>Delivery address.</h2><p className="checkout-intro">Where should we send your order?</p><form onSubmit={beginPayment}><label>Door / flat number<input name="door" required autoComplete="address-line1" value={address.door} onChange={e => updateAddress('door', e.target.value)} placeholder="Flat 4B / Door 24" autoFocus /></label><label>Address line 1 <span className="required-note">Required</span><input name="address-line1" required autoComplete="address-line1" value={address.line1} onChange={e => updateAddress('line1', e.target.value)} placeholder="Street, area or locality" /></label><label>Address line 2 <span className="optional-note">Optional</span><input name="address-line2" autoComplete="address-line2" value={address.line2} onChange={e => updateAddress('line2', e.target.value)} placeholder="Landmark or nearby place" /></label><div className="address-grid"><label>City<input name="city" required autoComplete="address-level2" value={address.city} onChange={e => updateAddress('city', e.target.value)} placeholder="Chennai" /></label><label>PIN code<input name="pincode" required inputMode="numeric" autoComplete="postal-code" maxLength="6" pattern="[1-9][0-9]{5}" value={address.pincode} onChange={e => updateAddress('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="600001" /></label></div><div className="checkout-total"><span>Amount payable</span><strong>{money(total)}</strong></div>{error && <p className="form-error">{error}</p>}<div className="checkout-actions"><button className="button outline" type="button" disabled={submitting} onClick={() => { setStep('contact'); setError('') }}><ArrowLeft size={17} /> Back</button><button className="button dark" disabled={submitting}>{submitting ? 'Opening payment…' : 'Proceed to payment'} <ArrowRight size={17} /></button></div><p className="payment-note">Payments are securely processed by Razorpay.</p></form></>}
  </div></div>
}

export default App
