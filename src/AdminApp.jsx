import { useCallback, useEffect, useState } from 'react'
import { Check, LayoutGrid, LogOut, PackagePlus, ShoppingBag } from 'lucide-react'
import { apiUrl } from './api'
import { OrdersSection, ProductForm, ProductsSection } from './components/admin/AdminSections'

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
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  function notify(message) { setToast(''); setTimeout(() => setToast(message), 10) }

  const loadProducts = useCallback(() => {
    fetch(apiUrl('/api/products')).then(r => r.json()).then(setProducts).catch(() => notify('Could not load products')).finally(() => setLoading(false))
  }, [])

  const loadOrders = useCallback(() => {
    fetch(apiUrl('/api/admin/orders'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (response.status === 401) { onLogout(); return [] }
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load orders')
        return data
      })
      .then(data => { if (data) setOrders(data) })
        .catch(error => { setOrders([]); notify(error.message || 'Could not load orders') })
  }, [token, onLogout])

  useEffect(() => { loadProducts() }, [loadProducts])
      useEffect(() => { if (tab === 'orders') loadOrders() }, [tab, loadOrders])
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

  async function updateOrderStatus(order, status) {
    if (order.status === 'pending_verification' && !window.confirm(status === 'confirmed'
      ? `Confirm UTR ${order.upi_utr} for ${order.customer} only after checking the payment in your bank or UPI app?`
      : `Reject payment claim for order #${order.id}?`)) return
    try {
      const response = await fetch(apiUrl(`/api/admin/orders/${order.id}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (response.status === 401) { onLogout(); return }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update order')
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status: data.status } : item))
      notify(status === 'confirmed' && order.status === 'pending_verification' ? 'Payment confirmed; order ready for processing'
        : data.notification_sent ? 'Order updated and SMS sent' : 'Order updated; SMS was not sent')
    } catch (error) {
      notify(error.message || 'Could not update order')
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
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => { setTab('orders'); setEditingProduct(null) }}><ShoppingBag size={16} /> Orders</button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => { setTab('add'); setEditingProduct(null) }}><PackagePlus size={16} /> Add product</button>
        </nav>
        <button className="button outline" onClick={logout}><LogOut size={15} /> Log out</button>
      </header>

      <main className="admin-main">
        {tab === 'products'
          ? <ProductsSection products={products} loading={loading} onEdit={startEdit} onDelete={deleteProduct} />
          : tab === 'orders'
          ? <OrdersSection orders={orders || []} loading={orders === null} onStatusChange={updateOrderStatus} onRefresh={loadOrders} />
          : <ProductForm
              key={editingProduct?.id ?? 'new'}
              token={token}
              product={editingProduct}
              onUnauthorized={onLogout}
              onSaved={productId => { notify(editingProduct ? `Product ${productId} updated` : `Product ${productId} added`); setEditingProduct(null); loadProducts(); setTab('products') }}
              notify={notify}
            />}
      </main>

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

export default AdminApp
