import { Heart, Minus, Plus, X } from 'lucide-react'
import { assetUrl } from '../api'
import { money } from '../utils/format'

export function Count({ value }) {
  return value ? <span className="count">{value}</span> : null
}

export function ProductCard({ product, saved, onSave, onAdd }) {
  return <article className="product-card">
    <div className="product-image">
      <img src={assetUrl(product.image)} alt={product.name} loading="lazy" />
      {product.badge && <span className="badge">{product.badge}</span>}
      <button className={`save ${saved ? 'saved' : ''}`} onClick={onSave} aria-label="Save to wishlist">
        <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <button className="quick-add" onClick={onAdd}>Quick add <Plus size={16} /></button>
    </div>
    <div className="product-info">
      <div><h3>{product.name}</h3><p>{product.color}</p></div>
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
      <h4>{item.name}</h4><p>{item.color} · One size</p><strong>{money(item.price)}</strong>
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