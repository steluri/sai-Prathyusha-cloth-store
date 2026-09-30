import { Heart, Minus, Plus, X } from 'lucide-react'
import { assetUrl, s3AssetUrl } from '../api'
import { money } from '../utils/format'

function retryProductImageFromS3(event, product) {
  const image = event.currentTarget
  if (image.dataset.s3Retry === 'true') return
  image.dataset.s3Retry = 'true'
  const candidates = [
    product.image_front,
    product.image,
    product.image_back,
    product.image_side,
    product.image_closeup,
    product.image_model,
    product.image_fit,
  ].map(s3AssetUrl).filter(Boolean)
  const fallback = candidates.find(url => new URL(url, window.location.href).href !== image.currentSrc)
  if (fallback) image.src = fallback
}

export function Count({ value }) {
  return value ? <span className="count">{value}</span> : null
}

export function ProductCard({ product, saved, quantity = 0, onSave, onAdd, onChangeQuantity, onOpen }) {
  function openFromKeyboard(event) {
    if (event.target === event.currentTarget && onOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onOpen()
    }
  }

  return <article className={`product-card${onOpen ? ' product-card-clickable' : ''}`} onClick={onOpen} onKeyDown={openFromKeyboard} role={onOpen ? 'link' : undefined} tabIndex={onOpen ? 0 : undefined} aria-label={onOpen ? `View ${product.name}` : undefined}>
    <div className="product-image">
      <img src={assetUrl(product.image_front || product.image)} alt={product.name} loading="lazy" onError={event => retryProductImageFromS3(event, product)} />
      {product.badge && <span className="badge">{product.badge}</span>}
      <button className={`save ${saved ? 'saved' : ''}`} onClick={event => { event.stopPropagation(); onSave() }} aria-label="Save to wishlist">
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
      {quantity > 0
        ? <div className="quick-quantity" onClick={event => event.stopPropagation()}>
            <button onClick={() => onChangeQuantity(-1)} aria-label={`Remove one ${product.name}`}><Minus size={16} /></button>
            <span aria-live="polite">{quantity}</span>
            <button onClick={() => onChangeQuantity(1)} aria-label={`Add one more ${product.name}`}><Plus size={16} /></button>
          </div>
        : <button className="quick-add" onClick={event => { event.stopPropagation(); onAdd() }}>Quick add <Plus size={16} /></button>}
    </div>
    <div className="product-info">
      <div>
        <h3>{product.name}</h3><p>{product.color}</p>
        {Array.isArray(product.sizes) && product.sizes.length > 0 && <div className="product-size-list" aria-label={`Available sizes: ${product.sizes.join(', ')}`}>
          <span>Sizes</span>{product.sizes.map(size => <span key={size}>{size}</span>)}
        </div>}
      </div>
      <div className="price"><strong>{money(product.price)}</strong>{product.old_price && <s>{money(product.old_price)}</s>}</div>
    </div>
  </article>
}

export function Drawer({ open, onClose, title, count, children }) {
  return <div className={`drawer-wrap ${open ? 'show' : ''}`} aria-hidden={!open}>
    <button className="scrim" onClick={onClose} aria-label="Close" />
    <aside className="drawer">
      <div className="drawer-head"><h2>{title} <span>{count}</span></h2><button className="icon-btn" onClick={onClose}><X /></button></div>
      {children}
    </aside>
  </div>
}

export function CartItem({ item, onChange }) {
  return <div className="cart-item">
    <img src={assetUrl(item.image)} alt={item.name} />
    <div>
      <h4>{item.name}</h4><p>{item.color} · {Array.isArray(item.sizes) && item.sizes.length ? `Available: ${item.sizes.join(', ')}` : 'One size'}</p><strong>{money(item.price)}</strong>
      <div className="quantity">
        <button onClick={() => onChange(-1)}><Minus size={13} /></button>
        <span>{item.quantity}</span>
        <button onClick={() => onChange(1)}><Plus size={13} /></button>
      </div>
    </div>
    <button className="remove" onClick={() => onChange(-item.quantity)}><X size={16} /></button>
  </div>
}

export function Empty({ icon, title, text, action }) {
  return <div className="empty">{icon}<h3>{title}</h3><p>{text}</p><button className="button dark" onClick={action}>Explore collection</button></div>
}