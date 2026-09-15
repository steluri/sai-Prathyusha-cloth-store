import { useCallback, useEffect, useState } from 'react'
import { Check, ImagePlus, LayoutGrid, LogOut, PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { apiUrl, assetUrl } from './api'

const money = value => `₹${Number(value).toLocaleString('en-IN')}`

const IMAGE_SLOTS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'side', label: 'Side' },
  { key: 'closeup', label: 'Close-up' },
  { key: 'model', label: 'Model wear' },
  { key: 'fit', label: 'Size / Fit' },
]

function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('admin-token') || '')

  return token
    ? <AdminDashboard token={token} onLogout={() => { localStorage.removeItem('admin-token'); setToken('') }} />
    : <AdminLogin onLogin={t => { localStorage.setItem('admin-token', t); setToken(t) }} />
}

function AdminLogin({ onLogin }) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const form = new FormData(e.currentTarget)
    try {
      const response = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onLogin(data.token)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-shell admin-login-shell">
      <form className="admin-login-card" onSubmit={submit}>
        <a className="logo" href="/">Pandu<span>.</span></a>
        <p className="eyebrow">Admin console</p>
        <h1>Sign in</h1>
        <label>Username<input name="username" required autoFocus placeholder="admin" /></label>
        <label>Password<input name="password" type="password" required placeholder="••••••••" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button dark wide" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function AdminDashboard({ token, onLogout }) {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  function notify(message) { setToast(''); setTimeout(() => setToast(message), 10) }

  const loadProducts = useCallback(() => {
    fetch(apiUrl('/api/products')).then(r => r.json()).then(setProducts).catch(() => notify('Could not load products')).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2800)
    return () => clearTimeout(id)
  }, [toast])

  async function logout() {
    try { await fetch(apiUrl('/api/admin/logout'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } }) } catch { /* ignore */ }
    onLogout()
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Remove "${product.name}"? This cannot be undone.`)) return
    try {
      const response = await fetch(apiUrl(`/api/admin/products/${product.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        onLogout()
        return
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Delete failed')
      }
      notify('Product removed')
      loadProducts()
    } catch (err) {
      notify(err.message || 'Could not remove product')
    }
  }

  function startEdit(product) {
    setEditingProduct(product)
    setTab('add')
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="logo" href="/">Pandu<span>.</span></a>
        <nav className="admin-tabs">
          <button className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setEditingProduct(null) }}><LayoutGrid size={16} /> Products</button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => { setTab('add'); setEditingProduct(null) }}><PackagePlus size={16} /> Add product</button>
        </nav>
        <button className="button outline" onClick={logout}><LogOut size={15} /> Log out</button>
      </header>

      <main className="admin-main">
        {tab === 'products'
          ? <ProductsSection products={products} loading={loading} onEdit={startEdit} onDelete={deleteProduct} />
          : <ProductForm
              key={editingProduct?.id ?? 'new'}
              token={token}
              product={editingProduct}
              onUnauthorized={onLogout}
              onSaved={() => { notify(editingProduct ? 'Product updated' : 'Product added'); setEditingProduct(null); loadProducts(); setTab('products') }}
              notify={notify}
            />}
      </main>

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

function ProductsSection({ products, loading, onEdit, onDelete }) {
  if (loading) return <p className="admin-empty">Loading products…</p>
  if (!products.length) return <p className="admin-empty">No products yet. Add your first one.</p>
  return (
    <div className="admin-product-grid">
      {products.map(product => (
        <article className="admin-product-card" key={product.id}>
          <img src={assetUrl(product.image_front || product.image)} alt={product.name} />
          <div>
            <h3>{product.name}</h3>
            <p>{product.category} · {product.color}</p>
            <strong>{money(product.price)}</strong>
            <div className="admin-card-actions">
              <button className="button outline" onClick={() => onEdit(product)}><Pencil size={14} /> Edit</button>
              <button className="button outline danger" onClick={() => onDelete(product)}><Trash2 size={14} /> Remove</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function ProductForm({ token, product, onSaved, onUnauthorized, notify }) {
  const isEditing = Boolean(product)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState({})

  function onFileChange(key, file) {
    setPreviews(current => ({ ...current, [key]: file ? URL.createObjectURL(file) : undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const response = await fetch(apiUrl(`/api/admin/products${isEditing ? `/${product.id}` : ''}`), {
        method: isEditing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      form.reset()
      setPreviews({})
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not save product. Please try again.')
      notify(err.message || 'Could not save product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="admin-add-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>Name<input name="name" required defaultValue={product?.name} placeholder="Linen Ease Shirt" /></label>
        <label>Category<select name="category" required defaultValue={product?.category ?? 'Women'}><option>Women</option><option>Men</option></select></label>
        <label>Color<input name="color" required defaultValue={product?.color} placeholder="Oat" /></label>
        <label>Price (₹)<input name="price" type="number" min="1" required defaultValue={product?.price} placeholder="2499" /></label>
        <label>Old price (₹, optional)<input name="old_price" type="number" min="1" defaultValue={product?.old_price ?? ''} placeholder="2999" /></label>
        <label>Badge (optional)<input name="badge" defaultValue={product?.badge ?? ''} placeholder="New / Bestseller / Limited" /></label>
      </div>
      <label className="admin-textarea">Description<textarea name="description" required defaultValue={product?.description} placeholder="A breezy linen-blend shirt with an easy, oversized silhouette." /></label>

      <h3 className="admin-section-title">Product images{isEditing && ' (leave a slot empty to keep the current image)'}</h3>
      <div className="admin-image-grid">
        {IMAGE_SLOTS.map(slot => (
          <label className="admin-image-slot" key={slot.key}>
            <input type="file" name={slot.key} accept="image/png,image/jpeg,image/webp" required={!isEditing}
              onChange={e => onFileChange(slot.key, e.target.files?.[0])} />
            <div className="admin-image-preview">
              {previews[slot.key]
                ? <img src={previews[slot.key]} alt={slot.label} />
                : product?.[`image_${slot.key}`] ? <img src={assetUrl(product[`image_${slot.key}`])} alt={slot.label} /> : <ImagePlus size={22} />}
            </div>
            <span>{slot.label}</span>
          </label>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      <button className="button dark wide" disabled={submitting}>
        {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add product'}
      </button>
    </form>
  )
}

export default AdminApp
