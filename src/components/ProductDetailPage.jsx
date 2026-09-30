import { useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ShoppingBag, ZoomIn, ZoomOut } from 'lucide-react'
import { assetUrl } from '../api'
import { money } from '../utils/format'
import { ProductCard } from './StoreUI'

const IMAGE_SLOTS = [
  ['image_front', 'Poster'],
  ['image_back', 'Back'],
  ['image_side', 'Side'],
  ['image_closeup', 'Close-up'],
  ['image_model', 'Model'],
  ['image_fit', 'Fit'],
  ['image', 'Product'],
]

function productImages(product) {
  const seen = new Set()
  return IMAGE_SLOTS.flatMap(([field, label]) => {
    const path = product[field]
    if (!path || seen.has(path)) return []
    seen.add(path)
    return [{ path, label }]
  })
}

export default function ProductDetailPage({
  product,
  inCart,
  cart,
  relatedProducts,
  wishlist,
  onBack,
  onOpenCart,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
  onChangeCartQuantity,
}) {
  const [imageIndex, setImageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const images = productImages(product)
  const currentImage = images[imageIndex] || images[0]
  const saved = wishlist.includes(product.id)

  function moveImage(direction) {
    setImageIndex(current => (current + direction + images.length) % images.length)
    setZoom(1)
  }

  function selectImage(index) {
    setImageIndex(index)
    setZoom(1)
  }

  function moveZoomFocus(event) {
    if (zoom === 1) return
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--zoom-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`)
    event.currentTarget.style.setProperty('--zoom-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`)
  }

  return <main className="product-detail-page">
    <button className="product-detail-back" onClick={onBack}><ArrowLeft size={17} /> Back to products</button>
    <section className="product-detail-top">
      <div className="product-gallery">
        {images.length > 1 && <div className="product-thumbnails" aria-label="Product images">
          {images.map((image, index) => <button className={imageIndex === index ? 'active' : ''} key={`${image.path}-${index}`} onClick={() => selectImage(index)} aria-label={`View ${image.label} image`} aria-pressed={imageIndex === index}>
            <img src={assetUrl(image.path)} alt="" />
          </button>)}
        </div>}
        <div className={`product-poster${zoom > 1 ? ' zoomed' : ''}`} onPointerMove={moveZoomFocus}>
          <img src={assetUrl(currentImage?.path)} alt={`${product.name} - ${currentImage?.label || 'product'} view`} style={{ transform: `scale(${zoom})` }} />
          <div className="product-zoom-controls" aria-label="Image zoom controls">
            <button onClick={() => setZoom(current => Math.max(0.5, current - 0.5))} disabled={zoom === 0.5} aria-label="Zoom out"><ZoomOut size={18} /></button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(current => Math.min(3, current + 0.5))} disabled={zoom === 3} aria-label="Zoom in"><ZoomIn size={18} /></button>
          </div>
          {images.length > 1 && <>
            <button className="product-slide previous" onClick={() => moveImage(-1)} aria-label="Previous image"><ChevronLeft /></button>
            <button className="product-slide next" onClick={() => moveImage(1)} aria-label="Next image"><ChevronRight /></button>
            <span className="product-image-count">{imageIndex + 1} / {images.length}</span>
          </>}
        </div>
      </div>

      <div className="product-detail-info">
        <p className="product-detail-category">{product.category}{product.item_type ? ` / ${product.item_type}` : ''}</p>
        <div className="product-detail-title">
          <div><h1>{product.name}</h1><p>{product.color}</p></div>
          <button className={`product-detail-save ${saved ? 'saved' : ''}`} onClick={() => onToggleWishlist(product)} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}><Heart size={21} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="product-detail-price"><strong>{money(product.price)}</strong>{product.old_price && <s>{money(product.old_price)}</s>}<span>Inclusive of all taxes</span></div>
        <p className="product-detail-description">{product.description}</p>
        {Array.isArray(product.sizes) && product.sizes.length > 0 && <div className="product-detail-sizes">
          <strong>Available sizes</strong>
          <div>{product.sizes.map(size => <span key={size}>{size}</span>)}</div>
        </div>}
        <button className="button dark product-detail-add" onClick={() => inCart ? onOpenCart() : onAddToCart(product)}><ShoppingBag size={17} /> {inCart ? 'Go to cart' : 'Add to bag'}</button>
        <div className="product-detail-notes"><p><strong>Free shipping</strong><span>On orders above ₹2,999</span></p><p><strong>Easy returns</strong><span>Within 14 days of delivery</span></p></div>
      </div>
    </section>

    {relatedProducts.length > 0 && <section className="product-related">
      <div className="product-related-heading"><p className="eyebrow">More to explore</p><h2>Similar {product.category} styles</h2></div>
      <div className="product-grid">
        {relatedProducts.map(item => <ProductCard key={item.id} product={item} saved={wishlist.includes(item.id)} quantity={cart.find(cartItem => cartItem.id === item.id)?.quantity || 0} onOpen={() => onOpenProduct(item)} onSave={() => onToggleWishlist(item)} onAdd={() => onAddToCart(item)} onChangeQuantity={delta => onChangeCartQuantity(item.id, delta)} />)}
      </div>
    </section>}
  </main>
}