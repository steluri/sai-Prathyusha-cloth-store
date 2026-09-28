import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
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
  const [frontPreview, setFrontPreview] = useState('')
  const [additionalFiles, setAdditionalFiles] = useState([])
  const additionalInput = useRef(null)
  const objectUrls = useRef(new Set())
  const optionalSlots = IMAGE_SLOTS.slice(1)
  const availableOptionalSlots = optionalSlots.filter(slot => !product?.[`image_${slot.key}`])
  const maximumAdditionalImages = availableOptionalSlots.length

  useEffect(() => () => {
    objectUrls.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  function createPreview(file) {
    const url = URL.createObjectURL(file)
    objectUrls.current.add(url)
    return url
  }

  function releasePreview(url) {
    if (!url) return
    URL.revokeObjectURL(url)
    objectUrls.current.delete(url)
  }

  function onFrontFileChange(event) {
    releasePreview(frontPreview)
    const file = event.target.files?.[0]
    setFrontPreview(file ? createPreview(file) : '')
  }

  function onAdditionalFilesChange(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.length + additionalFiles.length > maximumAdditionalImages) {
      setError(`You can add up to ${maximumAdditionalImages} optional images for this product.`)
      return
    }
    setError('')
    const selectedFiles = files.map(file => ({ file, preview: createPreview(file) }))
    setAdditionalFiles(current => [...current, ...selectedFiles])
  }

  function removeAdditionalFile(index) {
    releasePreview(additionalFiles[index]?.preview)
    setAdditionalFiles(current => current.filter((_, fileIndex) => fileIndex !== index))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.delete('additional_images')
    additionalFiles.forEach(({ file }) => formData.append('additional_images', file))
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
      releasePreview(frontPreview)
      additionalFiles.forEach(({ preview }) => releasePreview(preview))
      setFrontPreview('')
      setAdditionalFiles([])
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
      <h3 className="admin-section-title">Product images</h3>
      <div className="admin-image-grid">
        <label className="admin-image-slot">
          <input type="file" name="front" accept="image/png,image/jpeg,image/webp" required={!isEditing && !product?.image_front}
            onChange={onFrontFileChange} />
          <div className="admin-image-preview">
            {frontPreview
              ? <img src={frontPreview} alt="Primary product preview" />
              : product?.image_front || product?.image
                ? <img src={assetUrl(product.image_front || product.image)} alt="Primary product" />
                : <ImagePlus size={22} />}
          </div>
          <span>Primary image · Required</span>
        </label>
        {optionalSlots.map(slot => product?.[`image_${slot.key}`] && (
          <div className="admin-image-slot" key={slot.key}>
            <div className="admin-image-preview"><img src={assetUrl(product[`image_${slot.key}`])} alt={slot.label} /></div>
            <span>{slot.label}</span>
          </div>
        ))}
        {additionalFiles.map(({ file, preview }, index) => (
          <div className="admin-image-slot admin-image-selected" key={`${file.name}-${index}`}>
            <div className="admin-image-preview"><img src={preview} alt={file.name} /></div>
            <span>{file.name}</span>
            <button type="button" className="admin-image-remove" aria-label={`Remove ${file.name}`} onClick={() => removeAdditionalFile(index)}><X size={15} /></button>
          </div>
        ))}
        {additionalFiles.length < maximumAdditionalImages && (
          <>
            <input ref={additionalInput} className="admin-image-multiple-input" type="file" name="additional_images"
              accept="image/png,image/jpeg,image/webp" multiple onChange={onAdditionalFilesChange} />
            <button type="button" className="admin-image-add-button" onClick={() => additionalInput.current?.click()}>
              <Plus size={20} />
              <span>Add optional images</span>
            </button>
          </>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="button dark wide" disabled={submitting}>
        {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add product'}
      </button>
    </form>
  )
}