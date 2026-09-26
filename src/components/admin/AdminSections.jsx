import { useState } from 'react'
import { ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { apiUrl, assetUrl } from '../../api'
import { money } from '../../utils/format'

const IMAGE_SLOTS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'side', label: 'Side' },
  { key: 'closeup', label: 'Close-up' },
  { key: 'model', label: 'Model wear' },
  { key: 'fit', label: 'Size / Fit' },
]

const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export function OrdersSection({ orders, loading, onStatusChange, onRefresh }) {
  if (loading) return <p className="admin-empty">Loading orders…</p>
  if (!orders.length) return <div className="orders-empty"><p>No orders yet.</p><button className="button outline" onClick={onRefresh}>Refresh</button></div>
  return (
    <section className="admin-orders">
      <div className="orders-heading"><h1>Orders</h1><button className="button outline" onClick={onRefresh}>Refresh</button></div>
      {orders.map(order => (
        <article className="admin-order-row" key={order.id}>
          <div className="order-summary">
            <strong>Order #{order.id}</strong>
            <span>{new Date(order.created_at).toLocaleString()}</span>
            <b>{money(order.total)}</b>
          </div>
          <div className="order-customer">
            <strong>{order.customer}</strong>
            <span>{order.email}</span>
            <span>{order.address || 'No address recorded'}</span>
          </div>
          <div className="order-items">
            {(order.items || []).map((item, index) => <span key={`${item.product_id}-${index}`}>Product #{item.product_id} × {item.quantity}</span>)}
          </div>
          <label className="order-status">Status
            <select value={order.status} onChange={event => onStatusChange(order, event.target.value)}>
              {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </article>
      ))}
    </section>
  )
}

export function ProductsSection({ products, loading, onEdit, onDelete }) {
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

export function ProductForm({ token, product, onSaved, onUnauthorized, notify }) {
  const isEditing = Boolean(product)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [previews, setPreviews] = useState({})

  function onFileChange(key, file) {
    setPreviews(current => ({ ...current, [key]: file ? URL.createObjectURL(file) : undefined }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const form = event.currentTarget
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
    } catch (submitError) {
      setError(submitError.message || 'Could not save product. Please try again.')
      notify(submitError.message || 'Could not save product')
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
              onChange={event => onFileChange(slot.key, event.target.files?.[0])} />
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