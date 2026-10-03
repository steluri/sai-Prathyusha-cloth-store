import { useEffect, useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { apiUrl, assetUrl } from '../../api'
import { mensCollections, womensCollections } from '../../data/collections'
import { money } from '../../utils/format'

const IMAGE_SLOTS = [
  { key: 'front', label: 'Poster' },
  { key: 'back', label: 'Back' },
  { key: 'side', label: 'Side' },
  { key: 'closeup', label: 'Close-up' },
  { key: 'model', label: 'Model wear' },
  { key: 'fit', label: 'Size / Fit' },
]

const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const itemTypesFor = collections => collections
  .filter(({ name }) => !['All Products', 'Boys Collections', 'Girls Collections'].includes(name))
  .map(({ name }) => name)
const ITEM_TYPES_BY_CATEGORY = {
  Men: itemTypesFor(mensCollections),
  Women: itemTypesFor(womensCollections),
  'Boy-Kid': itemTypesFor(mensCollections),
  'Girl-Kid': itemTypesFor(womensCollections),
}
const ADULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']
const KID_SIZE_OPTIONS = ['1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y', '13-14Y']
const INCH_SIZE_OPTIONS = Array.from({ length: 21 }, (_, index) => `${index + 20} in`)
const LOWER_BODY_TYPES = new Set(['Jeans', 'Trousers', 'Dhotis', 'Chudidars'])
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
let imageUploadSequence = 0

async function processImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a PNG, JPEG, or WebP image.')
  }
  const source = await globalThis.createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  try {
    canvas.width = source.width
    canvas.height = source.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not process this image in your browser.')
    while (true) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.85, 0.7, 0.55, 0.4, 0.25]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality))
        if (!blob || blob.type !== 'image/webp') throw new Error('This browser cannot create WebP images.')
        if (blob.size <= MAX_IMAGE_BYTES) {
          return new globalThis.File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' })
        }
      }
      if (Math.max(canvas.width, canvas.height) <= 256) {
        throw new Error('Could not compress this image below 2 MB.')
      }
      canvas.width = Math.max(1, Math.floor(canvas.width * 0.8))
      canvas.height = Math.max(1, Math.floor(canvas.height * 0.8))
    }
  } finally {
    source.close()
    canvas.width = 0
    canvas.height = 0
  }
}

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
            {(order.items || []).map((item, index) => <span key={`${item.product_id}-${index}`}>{item.name || `Product #${item.product_id}`} × {item.quantity}{item.price != null ? ` · ${money(item.price)} each` : ''}</span>)}
            {order.upi_utr && <span>UPI UTR: <strong>{order.upi_utr}</strong></span>}
          </div>
          {order.upi_utr && order.status === 'cancelled'
            ? <div className="order-status"><strong>UPI claim rejected</strong></div>
            : order.status === 'pending_verification'
            ? <div className="order-status"><strong>Awaiting UPI verification</strong><button className="button dark" onClick={() => onStatusChange(order, 'confirmed')}>Confirm payment</button><button className="button outline" onClick={() => onStatusChange(order, 'cancelled')}>Reject claim</button></div>
            : <label className="order-status">Status
                <select value={order.status} onChange={event => onStatusChange(order, event.target.value)}>
                  {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>}
        </article>
      ))}
    </section>
  )
}

export function ProductsSection({ products, loading, onEdit, onDelete, onToggleBestSeller }) {
  if (loading) return <p className="admin-empty">Loading products…</p>
  if (!products.length) return <p className="admin-empty">No products yet. Add your first one.</p>
  return (
    <div className="admin-product-grid">
      {products.map(product => (
        <article className="admin-product-card" key={product.id}>
          <img src={assetUrl(product.image_front || product.image)} alt={product.name} />
          <div>
            <h3>{product.name}</h3>
            <p>{product.category}{product.item_type ? ` · ${product.item_type}` : ''} · {product.color}</p>
            <strong>{money(product.price)}</strong>
            <div className="admin-card-actions">
              <button className="button outline" onClick={() => onEdit(product)}><Pencil size={14} /> Edit</button>
              <button className="button outline danger" onClick={() => onDelete(product)}><Trash2 size={14} /> Remove</button>
              <button className={`button outline admin-best-seller-toggle${product.best_seller ? ' active' : ''}`} aria-pressed={Boolean(product.best_seller)} onClick={() => onToggleBestSeller(product)}><Star size={14} fill={product.best_seller ? 'currentColor' : 'none'} />{product.best_seller ? 'Remove from best sellers' : 'Mark as best seller'}</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function ProductForm({ token, product, onSaved, onUnauthorized, notify }) {
  const isEditing = Boolean(product)
  const [category, setCategory] = useState(product?.category ?? 'Women')
  const [itemType, setItemType] = useState(product?.item_type ?? '')
  const [sizes, setSizes] = useState(() => Array.isArray(product?.sizes) ? product.sizes : [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [frontUpload, setFrontUpload] = useState(null)
  const [additionalFiles, setAdditionalFiles] = useState([])
  const additionalInput = useRef(null)
  const objectUrls = useRef(new Set())
  const stagedImagePaths = useRef(new Set())
  const optionalSlots = IMAGE_SLOTS.slice(1)
  const itemTypeOptions = ITEM_TYPES_BY_CATEGORY[category] ?? []
  const isKidsCategory = category === 'Boy-Kid' || category === 'Girl-Kid'
  const sizeOptions = isKidsCategory ? KID_SIZE_OPTIONS : LOWER_BODY_TYPES.has(itemType) ? INCH_SIZE_OPTIONS : ADULT_SIZE_OPTIONS
  const availableOptionalSlots = optionalSlots.filter(slot => !product?.[`image_${slot.key}`])
  const maximumAdditionalImages = availableOptionalSlots.length
  const primaryImageReady = frontUpload
    ? frontUpload.status === 'uploaded'
    : Boolean(product?.image_front || product?.image)
  const uploadsReady = primaryImageReady && additionalFiles.every(image => image.status === 'uploaded')

  useEffect(() => () => {
    objectUrls.current.forEach(url => URL.revokeObjectURL(url))
    stagedImagePaths.current.forEach(path => {
      fetch(apiUrl('/api/admin/product-images'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      }).catch(() => {})
    })
  }, [token])

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

  function updateImageState(setter, imageId, updates) {
    setter(current => {
      if (Array.isArray(current)) {
        return current.map(image => image.id === imageId ? { ...image, ...updates } : image)
      }
      return current?.id === imageId ? { ...current, ...updates } : current
    })
  }

  async function uploadImage(image, slot, updateImage) {
    try {
      const processedFile = await processImage(image.file)
      updateImageState(updateImage, image.id, { status: 'uploading' })
      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('slot', slot)
      const response = await fetch(apiUrl('/api/admin/product-images'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.status === 401) {
        onUnauthorized()
        return
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Could not upload ${image.file.name}.`)
      if (typeof data.path !== 'string' || !data.path) throw new Error('The upload response did not include an image path.')
      stagedImagePaths.current.add(data.path)
      updateImageState(updateImage, image.id, { path: data.path, status: 'uploaded' })
    } catch (uploadError) {
      updateImageState(updateImage, image.id, { status: 'failed', error: uploadError.message })
      notify(uploadError.message || `Could not upload ${image.file.name}.`)
    }
  }

  async function discardStagedImage(path) {
    if (!path) return true
    try {
      const response = await fetch(apiUrl('/api/admin/product-images'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (response.status === 401) {
        onUnauthorized()
        return false
      }
      const data = response.ok ? {} : await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not remove the image from storage.')
      stagedImagePaths.current.delete(path)
      return true
    } catch (deleteError) {
      notify(deleteError.message || 'Could not remove the image from storage.')
      return false
    }
  }

  function onFrontFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    releasePreview(frontUpload?.preview)
    if (frontUpload?.path) void discardStagedImage(frontUpload.path)
    const image = { id: ++imageUploadSequence, file, preview: createPreview(file), path: '', status: 'processing' }
    setFrontUpload(image)
    setError('')
    void uploadImage(image, 'front', setFrontUpload)
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
    const selectedFiles = files.map((file, index) => ({
      id: ++imageUploadSequence,
      file,
      slot: availableOptionalSlots[additionalFiles.length + index].key,
      preview: createPreview(file),
      path: '',
      status: 'processing',
    }))
    setAdditionalFiles(current => [...current, ...selectedFiles])
    selectedFiles.forEach(image => { void uploadImage(image, image.slot, setAdditionalFiles) })
  }

  async function removeFrontFile() {
    if (!frontUpload || frontUpload.status === 'processing' || frontUpload.status === 'uploading' || submitting) return
    if (!await discardStagedImage(frontUpload.path)) return
    releasePreview(frontUpload.preview)
    setFrontUpload(null)
  }

  async function removeAdditionalFile(index) {
    const image = additionalFiles[index]
    if (!image || image.status === 'processing' || image.status === 'uploading' || submitting) return
    if (!await discardStagedImage(image.path)) return
    releasePreview(image?.preview)
    setAdditionalFiles(current => current.filter((_, fileIndex) => fileIndex !== index))
  }

  async function submit(event) {
    event.preventDefault()
    if (!sizes.length) {
      setError('Choose at least one available size.')
      return
    }
    if (!uploadsReady) {
      setError('Wait for all selected images to finish uploading before saving.')
      return
    }
    setSubmitting(true)
    setError('')
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.delete('front')
    formData.delete('front_path')
    formData.delete('additional_images')
    formData.delete('additional_image_paths')
    if (frontUpload?.path) formData.set('front_path', frontUpload.path)
    additionalFiles.forEach(image => formData.append('additional_image_paths', image.path))
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
      if (!Number.isInteger(data.id)) throw new Error('The save response did not include a product ID.')
      stagedImagePaths.current.clear()
      form.reset()
      releasePreview(frontUpload?.preview)
      additionalFiles.forEach(({ preview }) => releasePreview(preview))
      setFrontUpload(null)
      setAdditionalFiles([])
      onSaved(data.id)
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
        <label>Item name<input name="name" required defaultValue={product?.name} placeholder="Linen Ease Shirt" /></label>
        <label>Category<select name="category" required value={category} onChange={event => { setCategory(event.target.value); setItemType(''); setSizes([]); setError('') }}>
          <option value="Women">Women</option><option value="Men">Men</option><option value="Boy-Kid">Boy-Kid</option><option value="Girl-Kid">Girl-Kid</option>
        </select></label>
        <label>Item type<select name="item_type" required value={itemType} onChange={event => { setItemType(event.target.value); setSizes([]); setError('') }}>
          <option value="">Choose item type</option>
          {itemTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
        </select></label>
        <label>Color<input name="color" required defaultValue={product?.color} placeholder="Oat" /></label>
        <label>Price (₹)<input name="price" type="number" min="1" required defaultValue={product?.price} placeholder="2499" /></label>
      </div>
      <fieldset className="admin-size-fieldset">
        <legend>Available sizes</legend>
        <div className="admin-size-options">
          {sizeOptions.map(size => (
            <label className="admin-size-option" key={size}>
              <input type="checkbox" name="sizes" value={size} checked={sizes.includes(size)} onChange={() => setSizes(current => current.includes(size) ? current.filter(value => value !== size) : [...current, size])} />
              <span>{size}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <h3 className="admin-section-title">Poster image</h3>
      <div className="admin-image-grid">
        <div className="admin-image-slot admin-image-selected admin-image-primary">
          <label className="admin-image-upload-label">
            <input type="file" accept="image/png,image/jpeg,image/webp" disabled={submitting || frontUpload?.status === 'processing' || frontUpload?.status === 'uploading'}
              onChange={onFrontFileChange} aria-required="true" />
            <div className={`admin-image-preview${frontUpload?.status === 'processing' || frontUpload?.status === 'uploading' ? ' is-uploading' : ''}`}>
              {frontUpload?.preview
                ? <img src={frontUpload.preview} alt="Poster preview" />
                : product?.image_front || product?.image
                  ? <img src={assetUrl(product.image_front || product.image)} alt="Product poster" />
                  : <ImagePlus size={22} />}
              {(frontUpload?.status === 'processing' || frontUpload?.status === 'uploading') && <span className="admin-image-upload-overlay"><LoaderCircle className="admin-image-upload-spinner" size={22} />{frontUpload.status === 'processing' ? 'Processing image' : 'Uploading to S3'}</span>}
            </div>
            <span>Poster image · Required</span>
            {frontUpload?.status === 'uploaded' && <span className="admin-image-upload-status">Uploaded to S3</span>}
            {frontUpload?.status === 'failed' && <span className="admin-image-upload-status error">{frontUpload.error}</span>}
          </label>
          {frontUpload && <button type="button" className="admin-image-remove" aria-label="Remove poster image" title="Remove poster image"
            disabled={frontUpload.status === 'processing' || frontUpload.status === 'uploading' || submitting} onClick={removeFrontFile}><X size={15} /></button>}
        </div>
        {optionalSlots.map(slot => product?.[`image_${slot.key}`] && (
          <div className="admin-image-slot" key={slot.key}>
            <div className="admin-image-preview"><img src={assetUrl(product[`image_${slot.key}`])} alt={slot.label} /></div>
            <span>{slot.label}</span>
          </div>
        ))}
        {additionalFiles.map((image, index) => (
          <div className="admin-image-slot admin-image-selected" key={image.id}>
            <div className={`admin-image-preview${image.status === 'processing' || image.status === 'uploading' ? ' is-uploading' : ''}`}>
              <img src={image.preview} alt={image.file.name} />
              {(image.status === 'processing' || image.status === 'uploading') && <span className="admin-image-upload-overlay"><LoaderCircle className="admin-image-upload-spinner" size={22} />{image.status === 'processing' ? 'Processing image' : 'Uploading to S3'}</span>}
            </div>
            <span>{image.file.name}</span>
            {image.status === 'uploaded' && <span className="admin-image-upload-status">Uploaded to S3</span>}
            {image.status === 'failed' && <span className="admin-image-upload-status error">{image.error}</span>}
            <button type="button" className="admin-image-remove" aria-label={`Remove ${image.file.name}`} title={`Remove ${image.file.name}`} disabled={image.status === 'processing' || image.status === 'uploading' || submitting} onClick={() => removeAdditionalFile(index)}><X size={15} /></button>
          </div>
        ))}
        {additionalFiles.length < maximumAdditionalImages && (
          <>
            <input ref={additionalInput} className="admin-image-multiple-input" type="file" name="additional_images"
              accept="image/png,image/jpeg,image/webp" multiple onChange={onAdditionalFilesChange} />
            <button type="button" className="admin-image-add-button" disabled={submitting} onClick={() => additionalInput.current?.click()}>
              <Plus size={20} />
              <span>Add optional images</span>
            </button>
          </>
        )}
      </div>
      <label className="admin-textarea">Description<textarea name="description" required defaultValue={product?.description} placeholder="Describe the material, fit, and details." /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button dark wide" disabled={submitting || !uploadsReady}>
        {submitting ? 'Saving product…' : isEditing ? 'Save changes' : 'Add product'}
      </button>
    </form>
  )
}