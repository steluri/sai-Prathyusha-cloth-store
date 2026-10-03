import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Search } from 'lucide-react'
import { mensCollections, womensCollections } from '../data/collections'
import { ProductCard } from './StoreUI'

function CollectionTiles({ titleId, eyebrow, title, description, audience, collections, onOpenCollection }) {
  return <section className={`mens-collections${audience === 'Women' ? ' womens-collections' : ''}`} aria-labelledby={titleId}>
    <div className="mens-collections-heading">
      <div><p className="eyebrow">{eyebrow}</p><h2 id={titleId}>{title}</h2></div>
      <p>{description}</p>
    </div>
    <div className="mens-collection-grid">
      {collections.map(item => (
        <button className="mens-collection-card" key={item.name} onClick={() => onOpenCollection(audience, item.name)}>
          <span className="mens-collection-image"><img src={item.image} alt="" loading="lazy" /></span>
          <span>{item.name}<ArrowRight size={17} /></span>
        </button>
      ))}
    </div>
  </section>
}

export default function HomePage({
  collectionView,
  category,
  sort,
  bestSellerLoading,
  bestSellerProducts,
  cart,
  wishlist,
  onCategoryChange,
  onSortChange,
  onShopCategory,
  onOpenCollection,
  onOpenProduct,
  onToggleWishlist,
  onAddToCart,
  onChangeCartQuantity,
  onSubscribe,
}) {
  const bestSellersTrack = useRef(null)
  const [scrollDuration, setScrollDuration] = useState(45)

  useEffect(() => {
    const group = bestSellersTrack.current?.querySelector('.best-sellers-track-group')
    if (!group) return
    const updateDuration = () => setScrollDuration(group.scrollWidth / 45)
    const observer = new globalThis.ResizeObserver(updateDuration)
    observer.observe(group)
    updateDuration()
    return () => observer.disconnect()
  }, [bestSellerProducts.length])

  function submitNewsletter(event) {
    event.preventDefault()
    onSubscribe()
  }

  return <main id="top" className={`home-page${collectionView ? ' home-view-hidden' : ''}`}>
    <button className="festival-poster" type="button" onClick={() => onShopCategory('All')} aria-label="Explore the Dasara festive collection">
      <img src="/dasara-festival-poster.svg" alt="Dasara Festival: A season to dress beautifully. Explore festive styles for every gathering." />
    </button>

    <CollectionTiles
      titleId="womens-collections-title"
      eyebrow="Made for every moment"
      title="Womens Collections"
      description="From everyday favourites to festive silhouettes, discover styles selected for women and girls."
      audience="Women"
      collections={womensCollections}
      onOpenCollection={onOpenCollection}
    />
    <CollectionTiles
      titleId="mens-collections-title"
      eyebrow="Find your style"
      title="Mens Collections"
      description="Everyday essentials and traditional favourites, thoughtfully selected for men and boys."
      audience="Men"
      collections={mensCollections}
      onOpenCollection={onOpenCollection}
    />

    <section className="collection" id="shop">
      <div className="section-heading">
        <div><p className="eyebrow">Loved and chosen</p><h2>Best sellers</h2></div>
        <p>Customer favourites, selected for the pieces worth coming back to.</p>
      </div>
      <div className="toolbar">
        <div className="category-tabs">
          {['All', 'Women', 'Men'].map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => onCategoryChange(item)}>{item}</button>)}
        </div>
        <label className="sort">Sort by <select value={sort} onChange={event => onSortChange(event.target.value)}><option>Featured</option><option>Newest</option><option>Price: Low to high</option><option>Price: High to low</option></select><ChevronDown size={15} /></label>
      </div>
      {bestSellerLoading ? <div className="loading-grid">{Array.from({ length: 4 }).map((_, index) => <div className="skeleton" key={index} />)}</div> :
        bestSellerProducts.length ? <div className="best-sellers-viewport" tabIndex={0} aria-label="Best-selling products">
          <div className="best-sellers-track" ref={bestSellersTrack} style={{ '--best-sellers-duration': `${scrollDuration}s` }}>
            {[0, 1].map(copy => <div className="best-sellers-track-group" key={copy} aria-hidden={copy === 1} inert={copy === 1}>
              {bestSellerProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} quantity={cart.find(item => item.id === product.id)?.quantity || 0} onOpen={() => onOpenProduct(product)} onSave={() => onToggleWishlist(product)} onAdd={() => onAddToCart(product)} onChangeQuantity={delta => onChangeCartQuantity(product.id, delta)} />)}
            </div>)}
          </div>
        </div> : <div className="empty-search"><Search size={28} /><h3>No best sellers yet</h3><p>Check back soon for customer favourites.</p></div>}
    </section>

    <section className="story">
      <div className="story-image"><div className="material-card"><span>01</span><strong>Natural fibres</strong><p>Breathable, tactile, enduring.</p></div></div>
      <div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Made with intention.<br /><em>Worn with ease.</em></h2><p>We believe getting dressed should feel simple. That means considered silhouettes, honest materials, and a palette that moves effortlessly through your wardrobe.</p><button className="button outline" onClick={() => onShopCategory('All')}>Discover our story <ArrowRight size={17} /></button></div>
    </section>

    <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>Notes from the studio</h2><p>New arrivals, quiet inspiration, and 10% off your first order.</p><form onSubmit={submitNewsletter}><input type="email" required placeholder="Your email address" /><button aria-label="Subscribe"><ArrowRight /></button></form></section>
  </main>
}