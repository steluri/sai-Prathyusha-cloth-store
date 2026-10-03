import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Heart, Menu, Search, ShoppingBag, SlidersHorizontal, UserRound, X,
} from 'lucide-react'
import { apiUrl, assetUrl } from './api'
import AccountPage from './components/AccountPage'
import CollectionPage from './components/CollectionPage'
import EmailCheckout from './components/EmailCheckout'
import HomePage from './components/HomePage'
import ProductDetailPage from './components/ProductDetailPage'
import { CartItem, Count, Drawer, Empty } from './components/StoreUI'
import { allCollections, kidsCollections, matchesCollection, mensCollections, womensCollections } from './data/collections'
import { money } from './utils/format'

const RAZORPAY_ENABLED = import.meta.env.VITE_ENABLE_RAZORPAY === 'true'
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']
const AGE_SIZES = ['1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y', '13-14Y']
const INCH_SIZES = Array.from({ length: 21 }, (_, index) => `${index + 20} in`)
const LOWER_BODY_TYPES = new Set(['Jeans', 'Trousers', 'Dhotis', 'Chudidars'])

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

function App() {
  const [account, setAccount] = useState(() => JSON.parse(localStorage.getItem('Pandu-account') || 'null'))
  const [accountOpen, setAccountOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [bestSellerProducts, setBestSellerProducts] = useState([])
  const [bestSellerLoading, setBestSellerLoading] = useState(true)
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [minimumPrice, setMinimumPrice] = useState('')
  const [maximumPrice, setMaximumPrice] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [saleOnly, setSaleOnly] = useState(false)

  useEffect(() => {
    Promise.all([fetch(apiUrl('/api/products')).then(r => r.json()), fetch(apiUrl('/api/wishlist')).then(r => r.json())])
      .then(([catalog, saved]) => { setProducts(catalog); setWishlist(saved.map(p => p.id)) })
      .catch(() => setToast('Start the Python API to load the collection.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch(apiUrl('/api/products/best-sellers'))
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(setBestSellerProducts)
      .catch(() => setBestSellerProducts([]))
      .finally(() => setBestSellerLoading(false))
  }, [])

  useEffect(() => {
    if (!account?.token) return
    fetch(apiUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${account.token}` } })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(data => setAccount(current => ({ ...current, user: data.user })))
      .catch(() => { localStorage.removeItem('Pandu-account'); setAccount(null) })
  }, [account?.token])

  useEffect(() => localStorage.setItem('Pandu-cart', JSON.stringify(cart)), [cart])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(id)
  }, [toast])

  const visibleBestSellers = useMemo(() => {
    let list = bestSellerProducts.filter(p => (category === 'All' || p.category === category) &&
      `${p.name} ${p.color}`.toLowerCase().includes(search.toLowerCase()))
    if (sort === 'Price: Low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to low') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [bestSellerProducts, category, search, sort])

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
      (!selectedSize || product.sizes?.includes(selectedSize)) &&
      (!saleOnly || product.old_price))
    if (sort === 'Price: Low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price: High to low') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'Newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [collectionBaseProducts, minimumPrice, maximumPrice, selectedColor, selectedSize, saleOnly, sort])

  const collectionColors = useMemo(() => [...new Set(collectionBaseProducts.map(product => product.color))], [collectionBaseProducts])
  const collectionSizeGroups = useMemo(() => {
    if (!collectionView) return []
    const availableSizes = new Set(collectionBaseProducts.flatMap(product => Array.isArray(product.sizes) ? product.sizes : []))
    const groups = collectionView.audience === 'Kids' || (collectionView.audience === 'All' && collectionView.type === 'Kids')
      ? [{ label: 'Age', sizes: AGE_SIZES }]
      : collectionView.audience === 'All' && collectionView.type === 'All Products'
        ? [{ label: 'Letters', sizes: LETTER_SIZES }, { label: 'Waist (inches)', sizes: INCH_SIZES }, { label: 'Age', sizes: AGE_SIZES }]
      : LOWER_BODY_TYPES.has(collectionView.type)
        ? [{ label: 'Waist (inches)', sizes: INCH_SIZES }]
        : collectionView.type === 'All Products'
          ? [{ label: 'Letters', sizes: LETTER_SIZES }, { label: 'Waist (inches)', sizes: INCH_SIZES }]
          : [{ label: 'Letters', sizes: LETTER_SIZES }]
    return groups
      .map(group => ({ ...group, sizes: group.sizes.filter(size => availableSizes.has(size)) }))
      .filter(group => group.sizes.length)
  }, [collectionBaseProducts, collectionView])
  const relatedProducts = useMemo(() => selectedProduct
    ? products.filter(product => product.id !== selectedProduct.id && product.category === selectedProduct.category).slice(0, 8)
    : [], [products, selectedProduct])

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
    setSelectedProduct(null)
    setCollectionView(null)
    setCategory(next)
    window.requestAnimationFrame(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }))
    setMobileOpen(false)
  }

  function openCollection(audience, type) {
    setSelectedProduct(null)
    if (collectionView?.audience !== audience) {
      setSelectedColor('')
      setSaleOnly(false)
    }
    if (collectionView?.audience !== audience || collectionView?.type !== type) setSelectedSize('')
    setCollectionView({ audience, type })
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openHeaderCollection(audience, type) {
    clearCatalogFilters()
    setFiltersOpen(false)
    openCollection(audience, type)
  }

  function openProduct(product) {
    setFiltersOpen(false)
    setSelectedProduct(product)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showHome() {
    setFiltersOpen(false)
    setAccountOpen(false)
    setSelectedProduct(null)
    setCollectionView(null)
    setMobileOpen(false)
  }

  function authenticate(nextAccount) {
    localStorage.setItem('Pandu-account', JSON.stringify(nextAccount))
    setAccount(nextAccount)
  }

  function logout() {
    localStorage.removeItem('Pandu-account')
    setAccount(null)
    notify('You have been logged out')
  }

  function clearCatalogFilters() {
    setMinimumPrice('')
    setMaximumPrice('')
    setSelectedColor('')
    setSelectedSize('')
    setSaleOnly(false)
  }

  const collectionTabs = collectionView?.audience === 'All'
    ? allCollections
    : collectionView?.audience === 'Kids'
      ? kidsCollections
      : collectionView?.audience === 'Women' ? womensCollections : mensCollections

  return (
    <div className="site-shell">
      <div className="announcement">Free shipping on orders over ₹2,999 <span>•</span> Easy 14-day returns</div>
      <header className="header">
        <div className="header-top">
          <button className="icon-btn mobile-menu" aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Menu size={21} /></button>
          <p className="header-note">Clothes for living, thoughtfully made.</p>
          <a className="logo" href="#top" onClick={showHome}>Pandu<span>.</span></a>
          <div className="header-actions">
            <label className="header-search" aria-label="Search products"><Search size={21} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search products" /></label>
            {collectionView && !accountOpen && !selectedProduct && <button className="icon-btn collection-filter-mobile" aria-label="Filter and sort" aria-expanded={filtersOpen} aria-controls="catalog-filter-controls" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={19} /></button>}
            <button className="icon-btn header-account" aria-label={account ? 'My account' : 'Log in or register'} onClick={() => { setAccountOpen(true); setSelectedProduct(null); setCollectionView(null); setMobileOpen(false); window.scrollTo(0, 0) }}><UserRound size={20} /><span>{account ? 'My account' : 'Login / Register'}</span></button>
            <button className="icon-btn" aria-label="Wishlist" onClick={() => setWishlistOpen(true)}><Heart size={21} /><Count value={wishlist.length} /></button>
            <button className="icon-btn header-bag" aria-label={`Shopping bag, ${cartCount} items, ${money(cartTotal)}`} onClick={() => setCartOpen(true)}><ShoppingBag size={21} /><Count value={cartCount} /><span className="header-total">{money(cartTotal)}</span></button>
          </div>
        </div>
        <div className="header-nav-row">
          <nav className={mobileOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
            <button onClick={showHome}>Home</button>
            <button onClick={() => openHeaderCollection('All', 'All Products')}>Shop</button>
            <button onClick={() => openHeaderCollection('Women', 'All Products')}>Women</button>
            <button onClick={() => openHeaderCollection('Men', 'All Products')}>Men</button>
            <button onClick={() => openHeaderCollection('Kids', 'All Kids')}>Kids</button>
            {collectionView && !accountOpen && !selectedProduct && <button className={`collection-filter-tab${filtersOpen ? ' active' : ''}`} aria-expanded={filtersOpen} aria-controls="catalog-filter-controls" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filter &amp; Sort</button>}
          </nav>
        </div>
      </header>

      {accountOpen && <AccountPage user={account?.user} token={account?.token} onAuthenticate={authenticate} onLogout={logout} onBack={showHome} />}

      {!accountOpen && selectedProduct && <ProductDetailPage
        key={selectedProduct.id}
        product={selectedProduct}
        inCart={cart.some(item => item.id === selectedProduct.id)}
        cart={cart}
        relatedProducts={relatedProducts}
        wishlist={wishlist}
        onBack={() => setSelectedProduct(null)}
        onOpenCart={() => setCartOpen(true)}
        onOpenProduct={openProduct}
        onToggleWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onChangeCartQuantity={changeQuantity}
      />}

      {!accountOpen && !selectedProduct && collectionView && <CollectionPage
        collectionView={collectionView}
        collectionTabs={collectionTabs}
        collectionColors={collectionColors}
        collectionSizeGroups={collectionSizeGroups}
        collectionProducts={collectionProducts}
        filtersOpen={filtersOpen}
        onCloseFilters={() => setFiltersOpen(false)}
        cart={cart}
        wishlist={wishlist}
        loading={loading}
        sort={sort}
        minimumPrice={minimumPrice}
        maximumPrice={maximumPrice}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        saleOnly={saleOnly}
        onClearFilters={clearCatalogFilters}
        onMinimumPriceChange={setMinimumPrice}
        onMaximumPriceChange={setMaximumPrice}
        onColorSelect={setSelectedColor}
        onSizeSelect={setSelectedSize}
        onSaleOnlyChange={setSaleOnly}
        onSortChange={setSort}
        onOpenCollection={openCollection}
        onOpenProduct={openProduct}
        onToggleWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onChangeCartQuantity={changeQuantity}
      />}

      {!accountOpen && !selectedProduct && <HomePage
        collectionView={collectionView}
        category={category}
        sort={sort}
        bestSellerLoading={bestSellerLoading}
        bestSellerProducts={visibleBestSellers}
        cart={cart}
        wishlist={wishlist}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onShopCategory={shopCategory}
        onOpenCollection={openCollection}
        onOpenProduct={openProduct}
        onToggleWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onChangeCartQuantity={changeQuantity}
        onSubscribe={() => notify('Welcome to the Pandu community')}
      />}

      <footer><a className="logo" href="#top" onClick={showHome}>Pandu<span>.</span></a><p>Clothes for living, thoughtfully made.</p><div><a href="#shop" onClick={showHome}>Shop</a><a href="#top" onClick={showHome}>About</a><a href="mailto:hello@Pandu.store">Contact</a></div><small>© 2026 Pandu Studio</small></footer>

      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Your bag" count={cartCount}>
        {!cart.length ? <Empty icon={<ShoppingBag />} title="Your bag is empty" text="Good things are waiting." action={() => { setCartOpen(false); shopCategory('All') }} /> : <>
          <div className="drawer-items">{cart.map(item => <CartItem key={item.id} item={item} onChange={delta => changeQuantity(item.id, delta)} />)}</div>
          <div className="cart-summary"><div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p>Taxes included. Shipping calculated at checkout.</p><button className="button dark wide" onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}>Continue to checkout <ArrowRight size={17} /></button></div>
        </>}
      </Drawer>

      <Drawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} title="Your wishlist" count={wishlist.length}>
        {!wishlist.length ? <Empty icon={<Heart />} title="Nothing saved yet" text="Tap the heart on pieces you love." action={() => { setWishlistOpen(false); shopCategory('All') }} /> : <div className="drawer-items">{products.filter(p => wishlist.includes(p.id)).map(item => <div className="saved-item" key={item.id}><img src={assetUrl(item.image)} alt={item.name} /><div><h4>{item.name}</h4><p>{item.color}</p><strong>{money(item.price)}</strong><button onClick={() => { addToCart(item); setWishlistOpen(false); setCartOpen(true) }}>Add to bag</button></div><button className="remove" onClick={() => toggleWishlist(item)}><X size={16} /></button></div>)}</div>}
      </Drawer>

      {checkoutOpen && <EmailCheckout total={cartTotal} cart={cart} user={account?.user} token={account?.token} onClose={() => setCheckoutOpen(false)} onComplete={order => { setCart([]); setCheckoutOpen(false); notify(`Order AV-${String(order.order_id).padStart(4, '0')} ${order.status === 'pending_verification' ? 'submitted for payment verification' : 'confirmed — thank you!'}`) }} razorpayEnabled={RAZORPAY_ENABLED} loadRazorpay={loadRazorpay} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

export function LegacyCheckout({ total, cart, onClose, onComplete }) {
  const [step, setStep] = useState('contact')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState('')
  const [otp, setOtp] = useState('')
  const [developmentOtp, setDevelopmentOtp] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
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
    e.preventDefault(); setError('')
    if (!RAZORPAY_ENABLED) {
      setError('Online checkout is currently unavailable.')
      return
    }
    setSubmitting(true)
    try {
      await loadRazorpay()
      const paymentOrder = await request('/api/payments/razorpay/order', {
        customer: name,
        mobile,
        verification_token: verificationToken,
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

  async function sendOtp() {
    setSendingOtp(true); setError('')
    try {
      const result = await request('/api/otp/send', { mobile })
      setOtpChallengeId(result.challenge_id)
      setOtp('')
      setDevelopmentOtp(result.development_otp || '')
      setVerificationToken('')
    } catch (err) {
      setError(err.message || 'Could not send verification code.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function verifyOtp() {
    setVerifyingOtp(true); setError('')
    try {
      const result = await request('/api/otp/verify', { challenge_id: otpChallengeId, otp })
      setVerificationToken(result.verification_token)
    } catch (err) {
      setError(err.message || 'Could not verify that code.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  function updateAddress(field, value) {
    setAddress(current => ({ ...current, [field]: value }))
  }

  return <div className="modal-wrap"><button className="scrim" onClick={onClose} aria-label="Close checkout" /><div className="checkout-modal"><button className="modal-close" onClick={onClose} aria-label="Close checkout"><X /></button><p className="eyebrow">Secure checkout · {step === 'contact' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
    {step === 'contact' ? <><h2>Your details.</h2><p className="checkout-intro">Tell us who the order is for.</p><form onSubmit={e => { e.preventDefault(); if (verificationToken) { setError(''); setStep('address') } }}><label>Full name<input name="name" required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label><label>Mobile number<div className="mobile-input"><span>+91</span><input name="mobile" type="tel" inputMode="numeric" autoComplete="tel" required maxLength="10" pattern="[6-9][0-9]{9}" value={mobile} onChange={e => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpChallengeId(''); setOtp(''); setDevelopmentOtp(''); setVerificationToken('') }} placeholder="98765 43210" /></div></label>{otpChallengeId && !verificationToken && <label>Verification code<input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength="6" pattern="[0-9]{6}" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" /></label>}{developmentOtp && <p className="development-otp">Development OTP: <strong>{developmentOtp}</strong></p>}{verificationToken && <p className="otp-verified">Mobile number verified</p>}{error && <p className="form-error">{error}</p>}{!otpChallengeId ? <button className="button dark wide" type="button" disabled={sendingOtp || mobile.length !== 10 || !name.trim()} onClick={sendOtp}>{sendingOtp ? 'Sending code…' : 'Send verification code'}</button> : !verificationToken ? <><button className="button dark wide" type="button" disabled={verifyingOtp || otp.length !== 6} onClick={verifyOtp}>{verifyingOtp ? 'Verifying…' : 'Verify mobile number'}</button><button className="otp-resend" type="button" disabled={sendingOtp} onClick={sendOtp}>{sendingOtp ? 'Sending code…' : 'Resend code'}</button></> : <button className="button dark wide">Continue to address <ArrowRight size={17} /></button>}</form></> : <><h2>Delivery address.</h2><p className="checkout-intro">Where should we send your order?</p><form onSubmit={beginPayment}><label>Door / flat number<input name="door" required autoComplete="address-line1" value={address.door} onChange={e => updateAddress('door', e.target.value)} placeholder="Flat 4B / Door 24" autoFocus /></label><label>Address line 1 <span className="required-note">Required</span><input name="address-line1" required autoComplete="address-line1" value={address.line1} onChange={e => updateAddress('line1', e.target.value)} placeholder="Street, area or locality" /></label><label>Address line 2 <span className="optional-note">Optional</span><input name="address-line2" autoComplete="address-line2" value={address.line2} onChange={e => updateAddress('line2', e.target.value)} placeholder="Landmark or nearby place" /></label><div className="address-grid"><label>City<input name="city" required autoComplete="address-level2" value={address.city} onChange={e => updateAddress('city', e.target.value)} placeholder="Chennai" /></label><label>PIN code<input name="pincode" required inputMode="numeric" autoComplete="postal-code" maxLength="6" pattern="[1-9][0-9]{5}" value={address.pincode} onChange={e => setAddress(current => ({ ...current, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="600001" /></label></div><div className="checkout-total"><span>Amount payable</span><strong>{money(total)}</strong></div>{error && <p className="form-error">{error}</p>}<div className="checkout-actions"><button className="button outline" type="button" disabled={submitting} onClick={() => { setStep('contact'); setError('') }}><ArrowLeft size={17} /> Back</button><button className="button dark" disabled={submitting}>{submitting ? 'Opening payment…' : 'Proceed to payment'} <ArrowRight size={17} /></button></div><p className="payment-note">Payments are securely processed by Razorpay.</p></form></>}
  </div></div>
}

export default App
