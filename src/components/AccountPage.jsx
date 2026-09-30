import { useEffect, useState } from 'react'
import { ArrowLeft, LogOut, Package } from 'lucide-react'
import { apiUrl } from '../api'
import { money } from '../utils/format'

export default function AccountPage({ user, token, onAuthenticate, onLogout, onBack }) {
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !token) return
    fetch(apiUrl('/api/account/orders'), { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load your orders.')
        setOrders(data)
      })
      .catch(fetchError => setError(fetchError.message))
      .finally(() => setLoading(false))
  }, [user, token])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(apiUrl(`/api/auth/${mode}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not continue. Please try again.')
      onAuthenticate(data)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return (
    <main className="account-page auth-page">
      <button className="account-back" onClick={onBack}><ArrowLeft size={17} /> Back to shop</button>
      <div className="auth-panel">
        <p className="eyebrow">Pandu account</p>
        <h1>{mode === 'register' ? 'Create your account.' : 'Welcome back.'}</h1>
        <p>Keep your order details together and follow every delivery.</p>
        <div className="auth-tabs" role="tablist">
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Sign up</button>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Log in</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && <label>Full name<input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} placeholder="Your name" /></label>}
          <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength="8" maxLength="128" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={event => update('password', event.target.value)} placeholder="Minimum 8 characters" /></label>
          {mode === 'register' && <label>Confirm password<input required type="password" minLength="8" maxLength="128" autoComplete="new-password" value={form.confirmPassword} onChange={event => update('confirmPassword', event.target.value)} placeholder="Enter password again" /></label>}
          {error && <p className="form-error">{error}</p>}
          <button className="button dark wide" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}</button>
        </form>
      </div>
    </main>
  )

  return (
    <main className="account-page profile-page">
      <button className="account-back" onClick={onBack}><ArrowLeft size={17} /> Back to shop</button>
      <header className="profile-heading">
        <div><p className="eyebrow">Your profile</p><h1>Hello, {user.name}.</h1><p>{user.email}</p></div>
        <button className="button outline" onClick={() => { setForm({ name: '', email: '', password: '', confirmPassword: '' }); onLogout() }}><LogOut size={17} /> Log out</button>
      </header>
      <section className="orders-section">
        <div className="orders-title"><h2>Your orders</h2><span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
        {loading && <p className="account-message">Loading your orders…</p>}
        {!loading && error && <p className="form-error">{error}</p>}
        {!loading && !error && !orders.length && <div className="orders-empty"><Package size={30} /><h3>No orders yet</h3><p>Your purchases will appear here after checkout.</p></div>}
        <div className="order-list">{orders.map(order => <article className="order-card" key={order.id}>
          <div className="order-card-heading"><div><span>Order</span><strong>AV-{String(order.id).padStart(4, '0')}</strong></div><span className={`order-status status-${order.status}`}>{order.status.replaceAll('_', ' ')}</span></div>
          <div className="order-items">{order.items.map(item => <div key={`${order.id}-${item.product_id}`}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div>
          <div className="order-meta"><span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><strong>{money(order.total)}</strong></div>
        </article>)}</div>
      </section>
    </main>
  )
}