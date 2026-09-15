import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Check, ChevronDown, Heart, Menu, Minus, Plus,
  Search, ShoppingBag, Sparkles, Truck, X,
} from 'lucide-react'
import { apiUrl, assetUrl } from './api'

const money = value => `₹${Number(value).toLocaleString('en-IN')}`

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
    setCategory(next)
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <div className="site-shell">
      <div className="announcement">Free shipping on orders over ₹2,999 <span>•</span> Easy 14-day returns</div>
      <header className="header">
        <button className="icon-btn mobile-menu" aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={21} /></button>
        <a className="logo" href="#top">Pandu<span>.</span></a>
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

      <main id="top">
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

        <section className="story">
          <div className="story-image"><div className="material-card"><span>01</span><strong>Natural fibres</strong><p>Breathable, tactile, enduring.</p></div></div>
          <div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Made with intention.<br /><em>Worn with ease.</em></h2><p>We believe getting dressed should feel simple. That means considered silhouettes, honest materials, and a palette that moves effortlessly through your wardrobe.</p><button className="button outline" onClick={() => shopCategory('All')}>Discover our story <ArrowRight size={17} /></button></div>
        </section>

        <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>Notes from the studio</h2><p>New arrivals, quiet inspiration, and 10% off your first order.</p><form onSubmit={e => { e.preventDefault(); notify('Welcome to the Pandu community') }}><input type="email" required placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></section>
      </main>

      <footer><a className="logo" href="#top">Pandu<span>.</span></a><p>Clothes for living, thoughtfully made.</p><div><a href="#shop">Shop</a><a href="#top">About</a><a href="mailto:hello@Pandu.store">Contact</a></div><small>© 2026 Pandu Studio</small></footer>

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault(); setSubmitting(true); setError('')
    const form = new FormData(e.currentTarget)
    try {
      const response = await fetch(apiUrl('/api/orders'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: form.get('name'), email: form.get('email'), items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onComplete(data)
    } catch (err) { setError(err.message || 'Checkout failed. Please try again.'); setSubmitting(false) }
  }
  return <div className="modal-wrap"><button className="scrim" onClick={onClose} /><div className="checkout-modal"><button className="modal-close" onClick={onClose}><X /></button><p className="eyebrow">Secure checkout</p><h2>Almost yours.</h2><p className="checkout-intro">Enter your details to place this demo order.</p><form onSubmit={submit}><label>Full name<input name="name" required placeholder="Your name" /></label><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Delivery address<textarea name="address" required placeholder="House, street, city, PIN code" /></label><div className="checkout-total"><span>Order total</span><strong>{money(total)}</strong></div>{error && <p className="form-error">{error}</p>}<button className="button dark wide" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'} <ArrowRight size={17} /></button></form></div></div>
}

export default App
